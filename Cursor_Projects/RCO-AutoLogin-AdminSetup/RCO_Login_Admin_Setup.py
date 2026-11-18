import sys
import time
from typing import List, Tuple

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

try:
	from webdriver_manager.chrome import ChromeDriverManager  # type: ignore
except Exception:  # pragma: no cover
	ChromeDriverManager = None  # type: ignore


URL = "http://adb-wxisdbin002.analytics.moodys.net:9780/MAUIWeb/html/login.html"
USERNAME = "Central"
PASSWORD = "a"
TARGET_RCO_URL = "http://adb-wxisdbin002.analytics.moodys.net:8088/rco"


def build_driver() -> webdriver.Chrome:
	chrome_options = Options()
	chrome_options.add_argument("--start-maximized")
	chrome_options.add_experimental_option("detach", True)
	if ChromeDriverManager is not None:
		service = Service(ChromeDriverManager().install())
		return webdriver.Chrome(service=service, options=chrome_options)
	return webdriver.Chrome(options=chrome_options)


def wait_first(wait: WebDriverWait, locators: List[Tuple[str, str]]):
	last_err = None
	for by, selector in locators:
		try:
			return wait.until(EC.presence_of_element_located((by, selector)))
		except Exception as e:
			last_err = e
	raise last_err  # type: ignore[misc]


def click_first(driver: webdriver.Chrome, wait: WebDriverWait, locators: List[Tuple[str, str]]):
	el = wait_first(wait, locators)
	try:
		wait.until(EC.element_to_be_clickable((By.XPATH, ".//*")))
		el.click()
	except Exception:
		driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", el)
		driver.execute_script("arguments[0].click();", el)
	return el

# ---------- Generic section helpers (e.g., 'Home', 'URL') ----------

def section_header_xpath(title: str) -> str:
	t = title.strip()
	return f"(//a[normalize-space()='{t}']|//*[self::div or self::span or self::button][normalize-space()='{t}'])[1]"


def ensure_section_open(driver: webdriver.Chrome, wait: WebDriverWait, title: str):
	header = wait.until(EC.presence_of_element_located((By.XPATH, section_header_xpath(title))))
	for attempt in range(4):
		# Check if already expanded by looking for the chevron/arrow state
		# Expanded sections typically have 'fa-chevron-down' or similar, collapsed have 'fa-chevron-right'
		try:
			# Try to find the chevron/arrow BEFORE the title (common pattern)
			chevron_xpaths = [
				section_header_xpath(title) + "/preceding-sibling::*[contains(@class,'fa-chevron') or contains(@class,'caret') or contains(@class,'glyphicon')][1]",
				section_header_xpath(title) + "/../*[contains(@class,'fa-chevron') or contains(@class,'caret') or contains(@class,'glyphicon')][1]",
				section_header_xpath(title) + "/descendant::*[contains(@class,'fa-chevron') or contains(@class,'caret') or contains(@class,'glyphicon')][1]",
				f"(//*/text()[normalize-space()='{title}']/ancestor::*[1]/preceding-sibling::*[contains(@class,'fa-') or contains(@class,'caret') or contains(@class,'glyphicon')])[1]",
				f"(//*/text()[normalize-space()='{title}']/ancestor::*[contains(@class,'panel') or contains(@class,'collapse')][1]//*[contains(@class,'fa-') or contains(@class,'caret') or contains(@class,'glyphicon')])[1]"
			]
			chevron = None
			for xpath in chevron_xpaths:
				try:
					chevron = driver.find_element(By.XPATH, xpath)
					if chevron:
						break
				except Exception:
					continue
			
			if chevron:
				# Check if it looks collapsed (right arrow)
				classes = chevron.get_attribute("class") or ""
				if "right" in classes or "collapsed" in classes:
					# Click the chevron to expand
					try:
						driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", chevron)
						time.sleep(0.1)
						chevron.click()
					except Exception:
						driver.execute_script("arguments[0].click();", chevron)
					time.sleep(0.3)
					continue  # Check again
				else:
					# Already expanded
					return
		except Exception:
			pass
		
		# Fallback: just click the header itself
		try:
			driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", header)
			header.click()
			time.sleep(0.3)
		except Exception:
			try:
				driver.execute_script("arguments[0].click();", header)
				time.sleep(0.3)
			except Exception:
				pass


def find_label_input_in_section(driver: webdriver.Chrome, wait: WebDriverWait, title: str, label_text: str):
	# Try multiple strategies to find the input field associated with the label
	strategies = [
		# Strategy 1: After the section header, find label and its sibling input
		(section_header_xpath(title) + f"/following::label[normalize-space()='{label_text}'][1]", "following-sibling::input[1]"),
		# Strategy 2: After the section header, find label and next input in DOM
		(section_header_xpath(title) + f"/following::label[normalize-space()='{label_text}'][1]", "following::input[1]"),
		# Strategy 3: Find label containing the text (case-insensitive) after section
		(section_header_xpath(title) + f"/following::label[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{label_text.lower()}')][1]", "following::input[1]"),
		# Strategy 4: Find any element with the text, then next input
		(section_header_xpath(title) + f"/following::*/text()[normalize-space()='{label_text}']/parent::*[1]", "following::input[1]"),
	]
	
	for label_xpath, input_xpath in strategies:
		try:
			label_el = wait.until(EC.presence_of_element_located((By.XPATH, label_xpath)))
			# Scroll into view
			driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", label_el)
			time.sleep(0.2)
			# Try to find input relative to label
			try:
				inp = label_el.find_element(By.XPATH, input_xpath)
			except Exception:
				inp = driver.find_element(By.XPATH, label_xpath + "/" + input_xpath)
			return inp
		except Exception:
			continue
	
	# If all strategies fail, raise error
	raise RuntimeError(f"Could not find input for label '{label_text}' in section '{title}'")


def set_section_field(driver: webdriver.Chrome, wait: WebDriverWait, title: str, label_text: str, value: str):
	inp = find_label_input_in_section(driver, wait, title, label_text)
	# Scroll to ensure it's visible
	driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", inp)
	time.sleep(0.2)
	
	# Wait for element to be clickable
	try:
		wait.until(EC.element_to_be_clickable(inp))
	except Exception:
		pass
	
	# Clear existing value using multiple methods
	try:
		inp.clear()
	except Exception:
		pass
	
	# Click and select all
	try:
		inp.click()
		time.sleep(0.1)
	except Exception:
		driver.execute_script("arguments[0].click();", inp)
	
	try:
		inp.send_keys(Keys.CONTROL, 'a')
		inp.send_keys(Keys.DELETE)
	except Exception:
		pass
	
	# Enter the value
	inp.send_keys(value)
	time.sleep(0.2)
	
	# Verify value was set
	actual_value = inp.get_attribute("value")
	if actual_value != value:
		print(f"Warning: Expected '{value}' but got '{actual_value}' for field '{label_text}'", file=__import__('sys').stderr)
	
	return inp

# ---------- Left menu helpers (Admin Tools → Environment → Web Server Settings) ----------

def click_menu_item(driver: webdriver.Chrome, text: str, wait: WebDriverWait, max_tries: int = 3):
	locators: List[Tuple[str, str]] = [
		(By.LINK_TEXT, text),
		(By.PARTIAL_LINK_TEXT, text),
		(By.XPATH, f"//*[@role='menuitem' or @role='treeitem'][normalize-space()='{text}']"),
		(By.XPATH, f"//*[contains(@class,'menu') or contains(@class,'nav') or contains(@class,'sidebar')]//*[normalize-space()='{text}']"),
		(By.XPATH, f"//a[normalize-space()='{text}']|//button[normalize-space()='{text}']|//*[normalize-space()='{text}' and (self::div or self::span)]"),
	]
	last_error = None
	for _ in range(max_tries):
		for by, sel in locators:
			try:
				el = driver.find_element(by, sel)
				try:
					driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", el)
					el.click()
				except Exception:
					driver.execute_script("arguments[0].click();", el)
				return True
			except Exception as e:
				last_error = e
		time.sleep(0.3)
	if last_error:
		raise last_error
	return False


def expand_and_click_subitem(driver: webdriver.Chrome, wait: WebDriverWait, parent_text: str, child_text: str):
	try:
		click_menu_item(driver, parent_text, wait)
		time.sleep(0.2)
	except Exception:
		pass
	if not driver.find_elements(By.XPATH, f"//*[normalize-space()='{child_text}']"):
		try:
			parent_xpath = f"(//*[normalize-space()='{parent_text}'])[1]"
			caret = driver.find_element(By.XPATH, parent_xpath + "/preceding::*[contains(@class,'caret') or contains(@class,'chevron') or contains(@class,'fa-chevron')][1]")
			try:
				caret.click()
			except Exception:
				driver.execute_script("arguments[0].click();", caret)
			time.sleep(0.2)
		except Exception:
			pass
	click_menu_item(driver, child_text, wait)

# ---------- Main flow ----------

def main() -> int:
	driver = build_driver()
	wait = WebDriverWait(driver, 20)

	driver.get(URL)

	username_locators: List[Tuple[str, str]] = [
		(By.ID, "username"),
		(By.NAME, "username"),
		(By.CSS_SELECTOR, "#loginForm input[name='username']"),
		(By.CSS_SELECTOR, "#loginForm input[type='text']"),
		(By.CSS_SELECTOR, "input[name='user']"),
		(By.CSS_SELECTOR, "input[name='UserName']"),
	]
	password_locators: List[Tuple[str, str]] = [
		(By.ID, "password"),
		(By.NAME, "password"),
		(By.CSS_SELECTOR, "#loginForm input[name='password']"),
		(By.CSS_SELECTOR, "#loginForm input[type='password']"),
		(By.CSS_SELECTOR, "input[name='pwd']"),
		(By.CSS_SELECTOR, "input[name='Password']"),
	]
	submit_locators: List[Tuple[str, str]] = [
		(By.CSS_SELECTOR, "#loginForm input[type='submit']"),
		(By.CSS_SELECTOR, "#loginForm button[type='submit']"),
		(By.CSS_SELECTOR, "input[type='submit']"),
		(By.CSS_SELECTOR, "button[type='submit']"),
		(By.CSS_SELECTOR, "#loginForm > fieldset > div:nth-child(3) > input"),
		(By.CSS_SELECTOR, "input[value='Login']"),
		(By.CSS_SELECTOR, "button#login, button[name='login']"),
	]

	user_el = wait_first(wait, username_locators)
	user_el.clear(); user_el.send_keys(USERNAME)
	pwd_el = wait_first(wait, password_locators)
	pwd_el.clear(); pwd_el.send_keys(PASSWORD)
	try:
		submit_el = wait_first(wait, submit_locators)
		submit_el.click()
	except Exception:
		pwd_el.send_keys(Keys.ENTER)

	time.sleep(2)

	# Open side menu if needed, then Admin Tools → Environment → Web Server Settings
	menu_toggle_locators = [
		(By.CSS_SELECTOR, "button[aria-label*='menu' i]"),
		(By.CSS_SELECTOR, "button[title*='menu' i]"),
		(By.CSS_SELECTOR, ".fa-bars, .icon-bars"),
		(By.XPATH, "//*[contains(@class,'fa-bars') or contains(@class,'icon-bars')]/ancestor::button[1]"),
	]
	for loc in menu_toggle_locators:
		try:
			click_first(driver, wait, [loc])
			break
		except Exception:
			continue
	try:
		click_menu_item(driver, "Admin Tools", wait)
	except Exception:
		pass
	expand_and_click_subitem(driver, wait, "Environment", "Web Server Settings")

	# Ensure Configuration tab is selected
	try:
		click_first(driver, wait, [
			(By.XPATH, "//*[contains(@class,'tab') or self::a][normalize-space()='Configuration']"),
			(By.XPATH, "//a[normalize-space()='Configuration']"),
		])
	except Exception:
		pass

	# Use URL section: set Riskconfidence: and Grid: then Save
	print("Step 1: Expanding URL section...", file=__import__('sys').stderr)
	# First try direct approach: find the row with "URL" text and click the chevron icon in that row
	try:
		url_row_xpaths = [
			"//*/text()[normalize-space()='URL']/ancestor::*[contains(@class,'panel-heading') or contains(@class,'accordion') or contains(@class,'collapse')][1]",
			"//*/text()[normalize-space()='URL']/ancestor::tr[1]",
			"//*/text()[normalize-space()='URL']/ancestor::div[contains(@class,'row') or contains(@class,'header')][1]"
		]
		url_row = None
		for xpath in url_row_xpaths:
			try:
				url_row = driver.find_element(By.XPATH, xpath)
				if url_row:
					break
			except Exception:
				continue
		
		if url_row:
			# Find and click the chevron/arrow icon within this row
			try:
				chevron = url_row.find_element(By.XPATH, ".//*[contains(@class,'fa-chevron') or contains(@class,'glyphicon-chevron') or contains(@class,'caret')]")
				driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", chevron)
				time.sleep(0.2)
				driver.execute_script("arguments[0].click();", chevron)
				time.sleep(0.5)
			except Exception:
				# Fallback: click the entire row
				driver.execute_script("arguments[0].click();", url_row)
				time.sleep(0.5)
	except Exception:
		pass
	
	# Use generic function as fallback
	ensure_section_open(driver, wait, "URL")
	time.sleep(0.5)
	print("URL section expanded.", file=__import__('sys').stderr)
	
	# Set Riskconfidence field
	print("Step 2: Setting Riskconfidence field...", file=__import__('sys').stderr)
	try:
		set_section_field(driver, wait, "URL", "Riskconfidence:", TARGET_RCO_URL)
		print(f"Riskconfidence field set to: {TARGET_RCO_URL}", file=__import__('sys').stderr)
	except Exception as e:
		print(f"Error setting Riskconfidence: {e}", file=__import__('sys').stderr)
		raise
	
	# Set Grid field
	print("Step 3: Setting Grid field...", file=__import__('sys').stderr)
	try:
		set_section_field(driver, wait, "URL", "Grid:", TARGET_RCO_URL)
		print(f"Grid field set to: {TARGET_RCO_URL}", file=__import__('sys').stderr)
	except Exception as e:
		print(f"Error setting Grid: {e}", file=__import__('sys').stderr)
		raise

	# Save on Configuration tab
	print("Step 4: Clicking Save button...", file=__import__('sys').stderr)
	try:
		save_locators = [
			(By.XPATH, "//*[self::button or self::a][contains(normalize-space(.), 'Persist')]"),
			(By.XPATH, "//*[self::button or self::a][contains(normalize-space(.), 'Save')]"),
			(By.CSS_SELECTOR, "button.btn-primary"),
			(By.XPATH, "//button[contains(text(), 'Save')]"),
			(By.XPATH, "//button[contains(text(), 'Persist')]"),
			(By.XPATH, "//input[@type='submit' and contains(@value, 'Save')]"),
		]
		click_first(driver, wait, save_locators)
		print("Save button clicked successfully!", file=__import__('sys').stderr)
		time.sleep(2)
		print("Configuration saved. Browser will remain open for verification.", file=__import__('sys').stderr)
	except Exception as e:
		print(f"Error clicking Save button: {e}", file=__import__('sys').stderr)
		raise
	
	return 0


if __name__ == "__main__":
	sys.exit(main())
