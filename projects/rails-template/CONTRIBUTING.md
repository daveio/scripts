# Contributing to %%PROJECTNAME%%

Thank you for considering contributing to %%PROJECTNAME%%!

## Code of Conduct

Please be respectful and constructive in all interactions related to this project. We aim to foster an inclusive and welcoming community.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/%%PROJECTNAME&&.git`
3. Set up the application: `bin/setup`
4. Create a branch for your changes: `git checkout -b your-feature-branch`

## Development Process

1. Make your changes
2. Write tests for your changes
3. Ensure all tests pass: `bin/rails test`
4. Ensure code style is consistent: `bin/rubocop`
5. Commit your changes with a descriptive message
6. Push to your fork and submit a pull request

## Testing Guidelines

We highly value test coverage in %%PROJECTNAME%%.

### Test Structure

Our test suite is organized as follows:

- **Model Tests**: Located in `test/models/`, these test model validations, associations, and methods
- **Controller Tests**: Located in `test/controllers/`, these test HTTP responses and application logic
- **System Tests**: Located in `test/system/`, these test end-to-end user workflows

### Writing Model Tests

Model tests should cover:

1. Validations (presence, uniqueness, format, etc.)
2. Associations (belongs_to, has_many, etc.)
3. Scopes and class methods
4. Instance methods
5. Serialization (if applicable)
6. Edge cases and error handling

Example:

```ruby
require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "user validity" do
    user = User.new(email: "test@example.com", password: "password123")
    assert user.valid?
  end

  test "user requires email" do
    user = User.new(password: "password123")
    assert_not user.valid?
    assert_includes user.errors[:email], "can't be blank"
  end

  # More tests...
end
```

### Writing Controller Tests

Controller tests should cover:

1. HTTP responses for each action
2. Authentication and authorization
3. Parameter handling
4. Redirects and renders
5. Flash messages
6. JSON responses (if applicable)

Example:

```ruby
require "test_helper"

class PostsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:john)
    @post = posts(:john_post)
    sign_in @user
  end

  test "should get index" do
    get posts_path
    assert_response :success
  end

  # More tests...
end
```

### Writing System Tests

System tests should cover end-to-end user workflows, such as:

1. User authentication
2. Form submissions
3. UI interactions
4. JavaScript functionality
5. Full feature workflows

Example:

```ruby
require "application_system_test_case"

class PostsTest < ApplicationSystemTestCase
  setup do
    @user = users(:john)

    # Log in with Devise
    visit new_user_session_path
    fill_in "Email", with: @user.email
    fill_in "Password", with: "password123"
    click_on "Log in"
  end

  test "creating a new post" do
    visit new_post_path

    fill_in "Content", with: "Test post content"
    check "Bluesky"
    click_on "Create Post"

    assert_text "Post was successfully created"
  end

  # More tests...
end
```

### Fixtures

We use fixtures for test data. Fixtures are located in `test/fixtures/` and should be:

1. Comprehensive enough to cover test cases
2. Realistic with plausible data
3. Minimal (don't include unnecessary fields)
4. Well-named for clarity

Example (`test/fixtures/users.yml`):

```yaml
john:
  email: john@example.com
  encrypted_password: <%= Devise::Encryptor.digest(User, 'password123') %>

jane:
  email: jane@example.com
  encrypted_password: <%= Devise::Encryptor.digest(User, 'password123') %>
```

### Testing Best Practices

1. **Single Responsibility**: Each test should focus on one specific behavior
2. **Isolation**: Tests should not depend on other tests
3. **Coverage**: Aim for high test coverage, especially for critical functionality
4. **Clarity**: Write clear, descriptive test names
5. **Speed**: Keep tests fast to run
6. **DRY**: Use setup, helper methods, and fixtures to avoid repetition

## Adding New Features

When adding new features:

1. Start by writing tests that describe the expected behavior
2. Implement the feature to make the tests pass
3. Refactor as needed while keeping tests passing
4. Update documentation to reflect the new feature

## Fixing Bugs

When fixing bugs:

1. First, write a test that reproduces the bug
2. Fix the bug so the test passes
3. Consider if related bugs might exist elsewhere
4. Update tests to prevent regression

## Running the Test Suite

```bash
# Run the entire test suite
bin/rails test

# Run model tests only
bin/rails test:models

# Run controller tests only
bin/rails test:controllers

# Run system tests only
bin/rails test:system

# Run a specific test file
bin/rails test test/models/post_test.rb

# Run a specific test
bin/rails test test/models/post_test.rb:42

# Run tests with coverage report
bin/rails test:coverage

# Run visual regression tests with Percy
bin/rails test:visual

# Run visual regression tests locally (saves screenshots to tmp/screenshots)
bin/rails test:visual_local
```

### Code Coverage

We use SimpleCov to track test coverage. When contributing new code, please aim to maintain or improve the current coverage level.

The project has a minimum coverage threshold of 80%, but we strive for higher coverage whenever possible. Priority areas for test coverage include:

1. Models and their relationships
2. Controllers and public endpoints
3. Service objects and business logic
4. Critical user flows

To check current test coverage:

```bash
bin/rails test:coverage
```

This will run the test suite with coverage tracking and open an HTML report in your browser when complete.

### Visual Regression Testing

We use Percy to track visual changes in the UI. When making UI changes, please run visual regression tests to ensure the UI is consistent.

To run visual regression tests with Percy (requires a Percy API token):

```bash
export PERCY_TOKEN=your_token_here
bin/rails test:visual
```

To run visual regression tests locally (no Percy account required):

```bash
bin/rails test:visual_local
```

When contributing UI changes:

1. Run visual regression tests locally to see what changed
2. Include screenshots in your PR if there are significant visual changes
3. Explain the rationale for visual changes
4. Make sure theme consistency is maintained (test with all Catppuccin variants)
5. Ensure responsive design works across different screen sizes

### Database Cleanliness

We use DatabaseCleaner to ensure tests run in isolation. When writing tests:

1. **Avoid Shared State**: Don't depend on data created in other tests
2. **Use Fixtures or Factories**: Create the exact data your test needs
3. **Clean Up After Tests**: Any test-specific data should be cleaned up in `teardown`
4. **Use Transactions When Possible**: They're faster than truncation
5. **Special Cases**: For tests that require special database handling, use:
   ```ruby
   DatabaseCleanerHelper.use_deletion do
     # Your test code here
   end
   ```

### Test Organization

We use contexts and shared examples to organize tests. When writing tests:

1. **Use Contexts for Related Tests**:

   ```ruby
   context "when user is logged in" do
     setup do
       @user = users(:john)
       sign_in_user(@user)
     end

     test "can view dashboard" do
       # Test code
     end

     context "with admin role" do
       setup do
         @user.admin = true
         @user.save!
       end

       test "can access admin panel" do
         # Test code
       end
     end
   end
   ```

2. **Use Shared Examples for Common Behavior**:

   ```ruby
   shared_examples_for "a validated model" do |model_class|
     test "requires name" do
       model = model_class.new
       assert_not model.valid?
       assert_includes model.errors[:name], "can't be blank"
     end
   end

   # Later in your test class:
   include_examples "a validated model", User
   include_examples "a validated model", Post
   ```

3. **Group Tests Logically**: Group tests by feature, state, or behavior
4. **Descriptive Test Names**: Use descriptive names that explain the expected behavior
5. **Keep Contexts Focused**: Each context should test a specific aspect or state

## Continuous Integration

All pull requests will be automatically tested with our CI pipeline. Make sure all tests pass before submitting your PR.

## Questions?

If you have any questions about contributing or testing, please open an issue or reach out to the maintainers.

Thank you for contributing to %%PROJECTNAME%%!
