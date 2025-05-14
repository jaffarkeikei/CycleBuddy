# Contributing to CycleBuddy

First off, thank you for considering contributing to CycleBuddy! It's people like you that make CycleBuddy such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct. Please report unacceptable behavior to bradyalimedi@gmail.com.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* Use a clear and descriptive title
* Describe the exact steps which reproduce the problem
* Provide specific examples to demonstrate the steps
* Describe the behavior you observed after following the steps
* Explain which behavior you expected to see instead and why
* Include screenshots if possible

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* Use a clear and descriptive title
* Provide a step-by-step description of the suggested enhancement
* Provide specific examples to demonstrate the steps
* Describe the current behavior and explain which behavior you expected to see instead
* Explain why this enhancement would be useful

### Pull Requests

* Fill in the required template
* Do not include issue numbers in the PR title
* Include screenshots and animated GIFs in your pull request whenever possible
* Follow the JavaScript/TypeScript and Rust styleguides
* Include thoughtfully-worded, well-structured tests
* Document new code
* End all files with a newline

## Development Process

1. Fork the repo
2. Create a new branch from `main`
3. Make your changes
4. Run the tests
5. Push to your fork
6. Submit a Pull Request

### Setting Up Development Environment

```bash
# Clone your fork
git clone https://github.com/your-username/cyclebuddy-stellar

# Add upstream remote
git remote add upstream https://github.com/original/cyclebuddy-stellar

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test-file.test.ts

# Run tests in watch mode
npm test -- --watch
```

### Coding Style

* Use 2 spaces for indentation
* Use semicolons
* Use meaningful variable names
* Write comments for complex logic
* Follow the TypeScript style guide
* Follow the Rust style guide

## Smart Contract Development

### Testing Contracts

```bash
# Build contracts
cargo build --target wasm32-unknown-unknown

# Run contract tests
cargo test

# Deploy to testnet
stellar-cli deploy --network testnet
```

### Contract Guidelines

* Write comprehensive tests
* Document all functions
* Include error handling
* Optimize for gas efficiency
* Follow security best practices

## Documentation

* Keep README.md up to date
* Document all new features
* Update API documentation
* Include JSDoc comments
* Update architecture diagrams

## Community

* Join our Discord server
* Participate in discussions
* Help others in issues
* Share your ideas
* Give feedback

## Questions?

If you have any questions, please feel free to contact us:

* Email: dev@cyclebuddy.com
* Discord: [Join our server](https://discord.gg/cyclebuddy)
* GitHub Issues

Thank you for contributing to CycleBuddy! 🚀 