# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin Ajax requests.

# Read more: https://github.com/cyu/rack-cors

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # Allow requests from development and production frontends
    origins "http://localhost:5173", "https://mahdara.next-version.com"

    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      expose: ["Authorization"],
      max_age: 600
  end

  # Public catalog: allow from any origin (mobile app, future web catalog)
  allow do
    origins "*"

    resource "/api/public/*",
      headers: :any,
      methods: [:get, :options, :head],
      max_age: 600
  end
end
