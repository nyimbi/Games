def test_import() -> None:
	import games
	assert hasattr(games, "__version__")
