# games

[![CI/CD Pipeline](https://github.com/nyimbiodero/games/workflows/CI/badge.svg)](https://github.com/nyimbiodero/games/actions)
[![codecov](https://codecov.io/gh/nyimbiodero/games/branch/main/graph/badge.svg)](https://codecov.io/gh/nyimbiodero/games)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![uv](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/uv/main/assets/badge/v0.json)](https://github.com/astral-sh/uv)
[![Ruff](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json)](https://github.com/astral-sh/ruff)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)
[![Checked with mypy](https://www.mypy-lang.org/static/mypy_badge.svg)](https://mypy-lang.org/)
[![security: bandit](https://img.shields.io/badge/security-bandit-green.svg)](https://github.com/PyCQA/bandit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> A comprehensive educational gaming platform designed for World Scholar's Cup (WSC) training, featuring 16 diverse academic games across 5 subjects with 475+ curated questions, built with modern Python tooling and best practices.

## ✨ Features

- 🎮 **16 Educational Games** spanning multiple academic categories
- 📚 **475+ Curated Questions** across 5 WSC subjects (Science, Literature, Arts, Social Studies, Special Area)
- 🌍 **World Scholar's Cup Training** with questions and game modes designed for WSC preparation
- 🚀 **Lightning-fast dependency management** with [UV](https://github.com/astral-sh/uv)
- 🔍 **Comprehensive code quality** with [Ruff](https://github.com/astral-sh/ruff) (linting + formatting)
- 🛡️ **Static type safety** with [MyPy](https://github.com/python/mypy)
- 🧪 **Robust testing framework** with [pytest](https://github.com/pytest-dev/pytest)
- 🔒 **Multi-layer security scanning** (Bandit, Safety, pip-audit)
- 🔄 **Automated quality gates** with pre-commit hooks
- 📚 **Professional documentation** with Sphinx
- 🐳 **Production-ready containerization** with optimized Docker builds
- 🌐 **Real-time multiplayer** capabilities
- 📊 **Performance monitoring** and benchmarking
- 🎯 **100% type coverage** and comprehensive testing

## 🎮 Game Categories

### Scholars Bowl
- **Buzzer Battle**: Race to buzz in first with the correct answer!
- **Category Challenge**: Draw category cards and answer questions in turns.
- **Team Trivia Night**: Answer together as a team for bonus points!
- **Scavenger Bowl**: Find hidden answers in the virtual room!

### Collaborative Writing
- **Story Chain**: Build a story together, one paragraph at a time.
- **Essay Sprint**: Write an essay together in real-time!
- **Role-Based Writing**: Each player writes a different section.
- **Argument Tennis**: Rally arguments back and forth on a topic.

### Scholars Challenge
- **Flashcard Frenzy**: Speed through flashcards to rack up points!
- **Pattern Puzzles**: Spot the pattern and find the missing piece.
- **Quickfire Quiz**: Rapid-fire questions - think fast!
- **Elimination Olympics**: Practice strategic guessing like the real competition.

### Team Debate
- **Mini-Debate**: Quick structured debates on fun topics.
- **Role-Play Debates**: Take on character roles and debate!
- **Argument Builder**: Collaborate to build the perfect argument.
- **Impromptu Challenge**: Think on your feet with surprise topics!

## 📚 Question Database

The platform includes 475+ carefully curated questions across 5 WSC subjects:

- **Science** (95 questions): Chemistry, physics, biology, astronomy, and earth sciences
- **Literature** (95 questions): Classic and contemporary literature, authors, and literary devices
- **Arts** (95 questions): Visual arts, music, dance, and artistic movements
- **Social Studies** (95 questions): History, geography, politics, and philosophy
- **Special Area** (95 questions): Current events, technology, and interdisciplinary topics

Questions are categorized by difficulty:
- **Easy**: Fundamental concepts and basic knowledge
- **Medium**: Intermediate understanding and application
- **Hard**: Advanced analysis and synthesis skills

## 🌍 World Scholar's Cup (WSC) Training

This platform is specifically designed to support World Scholar's Cup training with:

- **Subject Coverage**: All 5 WSC subjects with balanced question distribution
- **Game Modes**: Mirroring WSC event formats (Scholars Bowl, Collaborative Writing, Scholars Challenge, Team Debate)
- **Difficulty Progression**: Questions that match WSC complexity levels
- **Team Practice**: Multiplayer modes for team-based preparation
- **Solo Practice**: Individual skill development and assessment
- **Real-time Feedback**: Immediate scoring and explanations for learning reinforcement

The platform enables coaches and teams to practice all aspects of WSC competition in a gamified, engaging environment that builds both knowledge and competitive skills.

## 🚀 Quick Start

### Prerequisites

#### Install UV (Recommended)
UV is a blazing-fast Python package installer and resolver, written in Rust.

```bash
# macOS and Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Or via pip
pip install uv
```

#### Alternative: Traditional Setup
If you prefer traditional tools:
```bash
# Ensure you have Python 3.10+ installed
python --version  # Should be 3.10 or higher
pip install --upgrade pip
```

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nyimbiodero/games.git
   cd games
   ```

2. **Set up the development environment:**
   ```bash
   make dev-setup
   ```

   This single command will:
   - 📦 Install all dependencies with UV
   - 🔗 Set up pre-commit hooks
   - ✅ Validate the environment
   - 🎯 Prepare for development

3. **Verify installation:**
   ```bash
   make quality-check
   ```

4. **Run the application:**
   ```bash
   make run
   ```

### Alternative Installation Methods

<details>
<summary>🐳 Docker Setup</summary>

```bash
# Build and run with Docker
docker build -t games:latest .
docker run -p 8000:8000 games:latest

# Or use docker-compose
docker-compose up --build
```
</details>

<details>
<summary>🎮 Play Tic-Tac-Toe</summary>

The project includes a classic Tic-Tac-Toe game implemented in HTML/CSS/JS:

```bash
# Open the game in your browser
open tic-tac-toe.html  # On macOS
# or
xdg-open tic-tac-toe.html  # On Linux
```
</details>

## 🛠️ Development

### Development Workflow

games follows modern Python development practices with comprehensive automation:

```bash
# 🚀 Daily development commands
make dev-setup          # One-time environment setup
make quality-check       # Run all quality checks
make test-coverage       # Run tests with coverage
make tdd                # Test-driven development mode
make docs               # Generate documentation
```

### Available Commands

Run `make help` to see all available commands:

<details>
<summary>📋 Core Development Commands</summary>

| Command | Description |
|---------|-------------|
| `make dev-setup` | Complete development environment setup |
| `make quality-check` | Run comprehensive quality pipeline |
| `make test` | Run test suite |
| `make test-coverage` | Run tests with coverage analysis |
| `make test-parallel` | Run tests in parallel |
| `make test-watch` | Continuous testing (watch mode) |
| `make format` | Format code with Ruff |
| `make lint` | Comprehensive linting |
| `make type-check` | Static type checking with MyPy |
| `make security-scan` | Security vulnerability scanning |

</details>

<details>
<summary>📦 Dependency Management</summary>

| Command | Description |
|---------|-------------|
| `make uv-add PACKAGE=name` | Add production dependency |
| `make uv-add-dev PACKAGE=name` | Add development dependency |
| `make uv-remove PACKAGE=name` | Remove dependency |
| `make deps-update` | Update all dependencies |
| `make deps-tree` | Show dependency tree |
| `make deps-audit` | Security audit dependencies |

</details>

<details>
<summary>🚀 Build and Deploy</summary>

| Command | Description |
|---------|-------------|
| `make build` | Build distribution packages |
| `make docker-build` | Build Docker image |
| `make docker-run` | Run in Docker container |
| `make upload-test` | Upload to TestPyPI |
| `make upload` | Upload to PyPI |

</details>

### Adding Dependencies

```bash
# Production dependencies
make uv-add PACKAGE="fastapi>=0.104.0"
make uv-add PACKAGE="pydantic[email]"

# Development dependencies
make uv-add-dev PACKAGE="pytest-mock"
make uv-add-dev PACKAGE="httpx"

# Remove dependencies
make uv-remove PACKAGE="unused-package"
```

### Code Quality Standards

games maintains the highest code quality standards:

#### 🎨 **Code Formatting**
- **Ruff** for ultra-fast linting and formatting (replaces Black + isort + flake8)
- **Consistent style** across the entire codebase
- **Automatic formatting** on save and commit

#### 🔍 **Static Analysis**
- **MyPy** for comprehensive type checking
- **Strict mode** enabled for maximum type safety
- **100% type coverage** requirement

#### 🧪 **Testing**
- **pytest** with comprehensive test suite
- **Minimum 80% coverage** requirement (configurable)
- **Property-based testing** with Hypothesis
- **Performance benchmarking** with pytest-benchmark

#### 🔒 **Security**
- **Bandit** for security vulnerability detection
- **Safety** for dependency vulnerability scanning
- **pip-audit** for package security auditing
- **Secret detection** in pre-commit hooks

### Pre-commit Hooks

Quality gates are automatically enforced:

```bash
# Automatically installed with dev-setup
make pre-commit-install

# Run manually
make pre-commit-run

# Update hooks
make pre-commit-update
```

**Enabled hooks:**
- ✅ Code formatting (Ruff)
- ✅ Import sorting (Ruff)
- ✅ Linting (Ruff)
- ✅ Type checking (MyPy)
- ✅ Security scanning (Bandit)
- ✅ Secret detection
- ✅ Conventional commits
- ✅ Documentation validation

## 🧪 Testing

### Running Tests

```bash
# Basic test run
make test

# With coverage analysis
make test-coverage

# Parallel execution (faster)
make test-parallel

# Watch mode (continuous testing)
make test-watch

# Performance benchmarks
make benchmark
```

### Test Organization

```
tests/
├── unit/              # Unit tests
├── integration/       # Integration tests
├── conftest.py       # Pytest configuration
└── test_main.py      # Main application tests
```

### Coverage Requirements

- **Minimum coverage:** 80% (configurable in `pyproject.toml`)
- **Branch coverage** enabled
- **HTML reports** generated in `reports/coverage/`
- **XML reports** for CI/CD integration

## 📚 Documentation

### Building Documentation

```bash
# Generate documentation
make docs

# Serve locally
make docs-serve  # http://localhost:8000

# Clean documentation
make docs-clean
```

### Documentation Structure

```
docs/
├── api/              # API documentation
├── design/           # Design documents
├── user_guides/      # User guides
└── dev_notes/        # Developer notes
```

### API Documentation

API documentation is automatically generated from docstrings:

- **Google-style docstrings** (enforced by pydocstyle)
- **Type hints** automatically documented
- **Sphinx autodoc** integration
- **Interactive examples** with code blocks

## 🐳 Docker

### Docker Images

games provides optimized Docker images:

```bash
# Production image (minimal, secure)
docker build -t games:latest .

# Development image (full tooling)
docker build --target development -t games:dev .

# Multi-architecture support
docker buildx build --platform linux/amd64,linux/arm64 -t games:latest .
```

### Docker Features

- 🔒 **Security-first:** Non-root user, minimal attack surface
- ⚡ **Performance:** Multi-stage builds, layer caching
- 🏗️ **UV optimization:** Leverages UV for fast dependency installation
- 📦 **Multi-arch:** AMD64 and ARM64 support
- 🔍 **Health checks:** Built-in health monitoring
- 📊 **Observability:** Structured logging and metrics

### Docker Compose

```bash
# Development environment
docker-compose -f docker-compose.dev.yml up

# Production deployment
docker-compose up --build

# With external services
docker-compose -f docker-compose.yml -f docker-compose.services.yml up
```

## 🚀 CI/CD

### GitHub Actions Workflows

games includes enterprise-grade CI/CD:

#### 🔄 **Main CI/CD Pipeline** (`.github/workflows/ci.yml`)
- **Multi-Python version testing** (3.10, 3.11, 3.12)
- **Cross-platform testing** (Ubuntu, Windows, macOS)
- **Quality gates** (linting, type checking, security)
- **Automated testing** with coverage reporting
- **Documentation building** and deployment
- **Package building** and PyPI publishing
- **Docker image building** with multi-arch support

### Quality Gates

Every commit and PR goes through:

1. 🎨 **Code formatting** validation
2. 🔍 **Comprehensive linting** (500+ rules)
3. 🛡️ **Type checking** (100% coverage)
4. 🔒 **Security scanning** (multiple tools)
5. 🧪 **Test execution** (unit + integration)
6. 📊 **Coverage analysis** (80% minimum)
7. 📚 **Documentation** building
8. 🐳 **Docker image** building

## 🔧 Configuration

### Project Configuration

All configuration is centralized in `pyproject.toml`:

<details>
<summary>📋 Tool Configuration</summary>

```toml
[tool.ruff]
line-length = 88
target-version = "py310"

[tool.mypy]
strict = true
warn_return_any = true

[tool.pytest.ini_options]
minversion = "7.0"
addopts = "--strict-markers --tb=short"

[tool.coverage.report]
fail_under = 80
show_missing = true
```
</details>

### Environment Variables

<details>
<summary>🌍 Environment Configuration</summary>

```bash
# Development
DEBUG=True
LOG_LEVEL=DEBUG

# Production
DEBUG=False
LOG_LEVEL=INFO
DATABASE_URL=postgresql://...

# API Keys
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
```
</details>

## 🏗️ Project Structure

```
games/
├── 📁 src/games/          # Source code (src-layout)
│   ├── __init__.py                   # Package initialization
│   ├── __main__.py                   # Main entry point
│   ├── api/                          # API modules
│   ├── cli/                          # Command-line interface
│   ├── core/                         # Core application logic
│   ├── data/                         # Game data and questions
│   │   └── questions/                # Subject-specific questions (5 subjects, 95 q each)
│   ├── models/                       # Data models
│   │   ├── game.py                   # Game definitions and models
│   │   ├── progress.py               # Progress tracking
│   │   ├── session.py                # Session management
│   │   └── user.py                   # User models
│   ├── services/                     # Business logic services
│   └── utils/                        # Utility functions
├── 📁 tests/                         # Test suite
│   ├── unit/                         # Unit tests
│   ├── integration/                  # Integration tests
│   └── conftest.py                   # Pytest configuration
├── 📁 docs/                          # Documentation
│   ├── api/                          # API documentation
│   └── user_guides/                  # User guides
├── 📁 .github/workflows/             # CI/CD pipelines
├── 📄 pyproject.toml                 # Project configuration
├── 📄 uv.lock                        # Dependency lock file
├── 📄 Dockerfile                     # Container definition
├── 📄 docker-compose.yml             # Local development
├── 📄 Makefile                       # Development automation
├── 📄 tic-tac-toe.html               # Classic game implementation
└── 📄 README.md                      # This file
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Process

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Set up** development environment (`make dev-setup`)
4. **Make** your changes
5. **Run** quality checks (`make quality-check`)
6. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
7. **Push** to the branch (`git push origin feature/amazing-feature`)
8. **Open** a Pull Request

### Code Standards

- 🎯 **100% type coverage** with MyPy
- 📊 **Minimum 80% test coverage**
- 🎨 **Consistent formatting** with Ruff
- 📝 **Google-style docstrings**
- 🔒 **Security best practices**
- ✅ **All pre-commit hooks** passing

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add new game feature
fix: resolve bug in game logic
docs: update game documentation
style: formatting changes
refactor: code restructuring
test: add tests for game features
chore: maintenance tasks
```

## 📈 Roadmap

### Current Version (v0.1.0)
- ✅ 16 diverse educational games
- ✅ 475+ WSC-aligned questions across 5 subjects
- ✅ Real-time multiplayer capabilities
- ✅ Comprehensive testing
- ✅ Documentation
- ✅ CI/CD pipeline
- ✅ Classic Tic-Tac-Toe implementation

### Upcoming Features
- 🚀 **Additional game types** and categories
- 📊 **Enhanced analytics and progress tracking**
- 🔌 **Plugin system for custom games**
- 🌍 **Internationalization and localization**
- 📱 **Mobile-responsive UI enhancements**
- 🎨 **Advanced graphics and animations**

See our [Project Board](https://github.com/nyimbiodero/games/projects) for detailed progress.

## 🆘 Support

### Getting Help

- 📚 **Documentation:** [https://games.readthedocs.io](https://games.readthedocs.io)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/nyimbiodero/games/discussions)
- 🐛 **Bug Reports:** [GitHub Issues](https://github.com/nyimbiodero/games/issues)
- 📧 **Email:** nyimbi@gmail.com

### Troubleshooting

<details>
<summary>🔧 Common Issues</summary>

**UV Installation Issues:**
```bash
# If UV installation fails
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc
```

**Permission Errors:**
```bash
# Fix common permission issues
sudo chown -R $USER:$USER ~/.local/share/uv
```

**Dependency Issues:**
```bash
# Reset and reinstall dependencies
make clean
make dev-setup
```
</details>

### Performance Issues

<details>
<summary>⚡ Optimization Tips</summary>

**Slow Tests:**
```bash
# Use parallel testing
make test-parallel

# Run specific test categories
pytest -m "not slow"
```

**Large Dependencies:**
```bash
# Check dependency tree
make deps-tree

# Audit dependency sizes
uv tree --outdated
```
</details>

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

games is built with and inspired by amazing open-source projects:

### Core Technologies
- 🚀 **[UV](https://github.com/astral-sh/uv)** - Ultra-fast Python package manager
- ⚡ **[Ruff](https://github.com/astral-sh/ruff)** - Blazing-fast Python linter
- 🛡️ **[MyPy](https://github.com/python/mypy)** - Static type checker
- 🧪 **[pytest](https://github.com/pytest-dev/pytest)** - Testing framework
- 🌐 **[FastAPI](https://github.com/tiangolo/fastapi)** - Modern web framework
- 🗄️ **[SQLAlchemy](https://github.com/sqlalchemy/sqlalchemy)** - Database toolkit

### Development Tools
- 🔄 **[Pre-commit](https://github.com/pre-commit/pre-commit)** - Git hooks
- 📚 **[Sphinx](https://github.com/sphinx-doc/sphinx)** - Documentation
- 🐳 **[Docker](https://www.docker.com/)** - Containerization
- 🤖 **[GitHub Actions](https://github.com/features/actions)** - CI/CD

### Special Thanks
- The **Python community** for continuous innovation
- **Astral** team for UV and Ruff
- All **contributors** and **maintainers**

---

<div align="center">

**Educational Gaming Platform built with ❤️ and modern Python tooling**

[![Star History Chart](https://api.star-history.com/svg?repos=nyimbiodero/games&type=Date)](https://star-history.com/#nyimbiodero/games&Date)

[⬆ Back to top](#games)

</div>