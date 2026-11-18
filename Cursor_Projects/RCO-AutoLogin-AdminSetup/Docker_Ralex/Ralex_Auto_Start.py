import sys
import time
from typing import List, Tuple

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC

try:
	from webdriver_manager.chrome import ChromeDriverManager  # type: ignore
except Exception:  # pragma: no cover
	ChromeDriverManager = None  # type: ignore


URL = "https://ralex.analytics.moodys.net/Ralex/Logon.aspx"
LOGIN_OPTION = "ANLAYTICS"  # as requested
FALLBACK_LOGIN_OPTION = "ANALYTICS"  # fallback if spelling differs on the site
USERNAME = "kumarni"
PASSWORD = "September092025"
INSTANCE_NAME = "ADB-WXISDBIN003"


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


def select_login_option(driver: webdriver.Chrome, wait: WebDriverWait, option_text: str, fallback_text: str = ""):
	select_locators: List[Tuple[str, str]] = [
		(By.ID, "ddlLogin"),
		(By.NAME, "ddlLogin"),
		(By.NAME, "Login"),
		(By.ID, "Login"),
		(By.ID, "Domain"),
		(By.NAME, "Domain"),
		(By.XPATH, "//select[option[normalize-space()='" + option_text + "' or normalize-space()='" + fallback_text + "']]") if fallback_text else (By.XPATH, "//select"),
	]
	sel_el = wait_first(wait, select_locators)
	if sel_el.tag_name.lower() != "select":
		try:
			sel_el = sel_el.find_element(By.XPATH, ".//select")
		except Exception:
			pass
	select = Select(sel_el)
	try:
		select.select_by_visible_text(option_text)
	except Exception:
		if fallback_text:
			select.select_by_visible_text(fallback_text)
		else:
			raise
	return sel_el  # return the actual SELECT element for relative lookups


def find_username_input_near_login(driver: webdriver.Chrome, wait: WebDriverWait) -> webdriver.remote.webelement.WebElement:
	# Prefer exact field if available (per inspect: id/name = txtLogin)
	try:
		return wait_first(wait, [
			(By.ID, "txtLogin"),
			(By.NAME, "txtLogin"),
		])
	except Exception:
		pass

	# 1) Start from the Login dropdown and find the nearest text input to its right/next
	login_select = wait_first(wait, [
		(By.ID, "ddlLogin"),
		(By.NAME, "ddlLogin"),
		(By.XPATH, "//label[normalize-space()='Login']/following::select[1]"),
		(By.XPATH, "(//select[contains(@id,'Login') or contains(@name,'Login')])[1]"),
	])

	# Prefer input in same row if laid out in a table
	try:
		row = login_select.find_element(By.XPATH, "ancestor::tr[1]")
		try:
			return row.find_element(By.XPATH, ".//input[@type='text' and not(@disabled) and not(@readonly)]")
		except Exception:
			pass
	except Exception:
		pass

	# Fallback: first text input following the select
	try:
		return login_select.find_element(By.XPATH, "following::input[@type='text' and not(@disabled) and not(@readonly)][1]")
	except Exception:
		pass

	# Last resort: any visible text input on the page (excluding hidden/readonly)
	return wait_first(wait, [
		(By.XPATH, "//input[@type='text' and not(@disabled) and not(@readonly) and not(contains(@style,'display:none'))]"),
	])


def navigate_to_start_instances_by_name(driver: webdriver.Chrome, wait: WebDriverWait):
	# Open Cloud dropdown
	cloud_locators: List[Tuple[str, str]] = [
		(By.LINK_TEXT, "Cloud"),
		(By.XPATH, "//nav//*[normalize-space()='Cloud' and (self::a or self::span or self::button)]"),
		(By.XPATH, "//*[contains(@class,'navbar') or contains(@class,'menu') or contains(@class,'nav')]//*[normalize-space()='Cloud']"),
	]
	cloud_el = wait_first(wait, cloud_locators)
	try:
		cloud_el.click()
	except Exception:
		driver.execute_script("arguments[0].click();", cloud_el)
	time.sleep(0.3)

	# Select "Start Instances By Name"
	start_by_name_locators: List[Tuple[str, str]] = [
		(By.LINK_TEXT, "Start Instances By Name"),
		(By.PARTIAL_LINK_TEXT, "Start Instances By Name"),
		(By.XPATH, "//a[normalize-space()='Start Instances By Name']|//button[normalize-space()='Start Instances By Name']"),
		(By.XPATH, "//*[contains(@class,'dropdown') or contains(@class,'menu')][.//*[normalize-space()='Cloud']]//a[normalize-space()='Start Instances By Name']"),
	]
	click_first(driver, wait, start_by_name_locators)
	# Wait for page input/search to be visible
	wait.until(EC.presence_of_element_located((By.XPATH, "//button[normalize-space()='Search']|//input[@type='submit' and @value='Search']")))


def start_instance_by_name(driver: webdriver.Chrome, wait: WebDriverWait, instance_name: str):
	# Fill instance name in the search box (try multiple strategies)
	search_input_locators: List[Tuple[str, str]] = [
		(By.XPATH, "//input[contains(@placeholder,'Instance name') or contains(@aria-label,'Instance name')]"),
		(By.XPATH, "//label[contains(translate(normalize-space(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'instance name')]/following::input[1]"),
		(By.XPATH, "//input[@type='text' and (contains(@id,'Instance') or contains(@name,'Instance') or contains(@id,'Search') or contains(@name,'Search'))]"),
	]
	try:
		search_el = wait_first(wait, search_input_locators)
		try:
			search_el.clear()
		except Exception:
			pass
		search_el.send_keys(instance_name)
	except Exception:
		# If we can't find the search field, proceed to look directly in tables
		pass

	# Click Search if available
	try:
		click_first(driver, wait, [
			(By.XPATH, "//button[normalize-space()='Search']|//input[@type='submit' and @value='Search']"),
		])
		time.sleep(0.8)
	except Exception:
		pass

	# Try to find the row with the instance in Search Results first
	row = None
	row_xpaths = [
		f"(//table//tr[.//*[normalize-space()='{instance_name}']])[1]",
		f"(//tr[.//*[normalize-space()='{instance_name}']])[1]",
	]
	for rx in row_xpaths:
		try:
			row = driver.find_element(By.XPATH, rx)
			if row:
				break
		except Exception:
			continue

	# Fallback: search in 'Instances already started in the past' section
	if row is None:
		try:
			row = driver.find_element(By.XPATH, f"//a[normalize-space()='{instance_name}']/ancestor::tr[1]")
		except Exception:
			pass

	if row is None:
		raise RuntimeError(f"Could not find row for instance '{instance_name}'")

	# Find and click the Start action in that row
	try:
		start_btn = row.find_element(By.XPATH, ".//a[normalize-space()='Start']|.//button[normalize-space()='Start']|.//input[@value='Start']")
		try:
			start_btn.click()
		except Exception:
			driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", start_btn)
			driver.execute_script("arguments[0].click();", start_btn)
		time.sleep(0.5)
	except Exception as e:
		raise RuntimeError(f"Start button not found for '{instance_name}': {e}")

	# Handle confirmation alert
	try:
		alert = WebDriverWait(driver, 10).until(EC.alert_is_present())
		alert.accept()
		print(f"Confirmed start for {instance_name}.", file=__import__('sys').stderr)
		time.sleep(1.0)
	except Exception:
		print("No confirmation alert detected or could not accept it.", file=__import__('sys').stderr)


def main() -> int:
	driver = build_driver()
	wait = WebDriverWait(driver, 20)

	print("Navigating to Ralex logon page...", file=__import__('sys').stderr)
	driver.get(URL)

	print("Selecting login dropdown option...", file=__import__('sys').stderr)
	try:
		select_login_option(driver, wait, LOGIN_OPTION, FALLBACK_LOGIN_OPTION)
		print("Selected login option.", file=__import__('sys').stderr)
	except Exception as e:
		print(f"Warning: Could not select '{LOGIN_OPTION}', trying fallback if available. Details: {e}", file=__import__('sys').stderr)
		select_login_option(driver, wait, FALLBACK_LOGIN_OPTION)

	# Find the username textbox relative to the Login dropdown (no reliance on 'username' label/ids)
	print("Filling login name near the Login dropdown...", file=__import__('sys').stderr)
	user_el = find_username_input_near_login(driver, wait)
	try:
		user_el.clear()
	except Exception:
		pass
	user_el.send_keys(USERNAME)

	# Password field
	password_locators: List[Tuple[str, str]] = [
		(By.ID, "txtPassword"),
		(By.NAME, "txtPassword"),
		(By.ID, "Password"),
		(By.NAME, "Password"),
		(By.NAME, "password"),
		(By.ID, "password"),
		(By.XPATH, "//input[@type='password']")
	]
	pwd_el = wait_first(wait, password_locators)
	try:
		pwd_el.clear()
	except Exception:
		pass
	pwd_el.send_keys(PASSWORD)

	# Submit with ENTER, then fallback click
	print("Submitting the form (ENTER)...", file=__import__('sys').stderr)
	try:
		pwd_el.send_keys(Keys.ENTER)
		time.sleep(1.5)
	except Exception:
		pass

	try:
		login_button_locators: List[Tuple[str, str]] = [
			(By.XPATH, "//*[self::button or self::input][@type='submit' and (contains(translate(normalize-space(.),'ENTER','enter'),'enter') or contains(translate(@value,'ENTER','enter'),'enter'))]"),
			(By.XPATH, "//button[contains(translate(normalize-space(.),'ENTER','enter'),'enter')]|//input[@type='submit' and contains(translate(@value,'ENTER','enter'),'enter')]"),
			(By.XPATH, "//button[contains(translate(.,'LOGON','logon'),'logon') or contains(translate(.,'SIGN IN','sign in'),'sign in')]"),
		]
		click_first(driver, wait, login_button_locators)
		print("Clicked the login button.", file=__import__('sys').stderr)
		time.sleep(1.5)
	except Exception:
		pass

	# After login, navigate and start instance
	try:
		navigate_to_start_instances_by_name(driver, wait)
		start_instance_by_name(driver, wait, INSTANCE_NAME)
		print("Instance start flow executed.", file=__import__('sys').stderr)
	except Exception as e:
		print(f"Post-login actions failed: {e}", file=__import__('sys').stderr)

	print("Flow completed. Browser will remain open for verification.", file=__import__('sys').stderr)
	return 0


if __name__ == "__main__":
	sys.exit(main())