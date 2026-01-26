import requests

_API_BASE_URL = "http://wf-home.lan:33001"



def move_next() -> bool:
	"""POST to /api/game/next. Returns True if successful, False otherwise."""
	url = f"{_API_BASE_URL}/api/game/next"
	try:
		response = requests.post(url)
		if response.status_code == 200:
			print("Moved to next item.")
			return True
		else:
			print(f"Failed to move to next item. Status code: {response.status_code} Response: {response.text}")
			return False
	except requests.RequestException as e:
		print(f"Error moving to next item: {e}")
		return False

def move_previous() -> bool:
	"""POST to /api/game/previous. Returns True if successful, False otherwise."""
	url = f"{_API_BASE_URL}/api/game/previous"
	try:
		response = requests.post(url)
		if response.status_code == 200:
			print("Moved to previous item.")
			return True
		else:
			print(f"Failed to move to previous item. Status code: {response.status_code} Response: {response.text}")
			return False
	except requests.RequestException as e:
		print(f"Error moving to previous item: {e}")
		return False

def set_orange() -> bool:
	"""POST to /api/game/battle/current with {"choice": "A"}. Returns True if successful, False otherwise."""
	url = f"{_API_BASE_URL}/api/game/battle/current"
	try:
		response = requests.post(url, json={"choice": "A"})
		if response.status_code == 200:
			print("Set orange item.")
			return True
		else:
			print(f"Failed to set orange item. Status code: {response.status_code} Response: {response.text}")
			return False
	except requests.RequestException as e:
		print(f"Error setting orange item: {e}")
		return False

def set_black() -> bool:
	"""POST to /api/game/battle/current with {"choice": "B"}. Returns True if successful, False otherwise."""
	url = f"{_API_BASE_URL}/api/game/battle/current"
	try:
		response = requests.post(url, json={"choice": "B"})
		if response.status_code == 200:
			print("Set black item.")
			return True
		else:
			print(f"Failed to set black item. Status code: {response.status_code} Response: {response.text}")
			return False
	except requests.RequestException as e:
		print(f"Error setting black item: {e}")
		return False

def clear_battle() -> bool:
	"""DELETE to /api/game/battle/current. Returns True if successful, False otherwise."""
	url = f"{_API_BASE_URL}/api/game/battle/current"
	try:
		response = requests.delete(url)
		if response.status_code == 200:
			print("Cleared battle.")
			return True
		else:
			print(f"Failed to clear battle. Status code: {response.status_code} Response: {response.text}")
			return False
	except requests.RequestException as e:
		print(f"Error clearing battle: {e}")
		return False

def get_game_state() -> dict | None:
	"""GET to /api/game/full. Returns game state dict if successful, None otherwise."""
	url = f"{_API_BASE_URL}/api/game/full"
	try:
		response = requests.get(url)
		if response.status_code == 200:
			data = response.json()
			# Calculate total wins from winsPerSong
			wins_per_song = data.get("winsPerSong", {})
			total_line_wins = 0
			total_house_wins = 0
			for song_wins in wins_per_song.values():
				if song_wins.get("line", 0) > 0:
					total_line_wins += 1
				if song_wins.get("fullhouse", 0) > 0:
					total_house_wins += 1
			return {
				"lineWinCount": total_line_wins,
				"houseWinCount": total_house_wins,
				"raw": data
			}
		else:
			print(f"Failed to get game state. Status code: {response.status_code} Response: {response.text}")
			return None
	except requests.RequestException as e:
		print(f"Error getting game state: {e}")
		return None