Rails.application.routes.draw do
  # Health check endpoint
  get "up" => "rails/health#show", as: :rails_health_check

  # API routes
  namespace :api do
    # Authentication
    post 'auth/login', to: 'auth#login'

    # Dashboard
    get 'dashboard/statistics', to: 'dashboard#statistics'

    # Tenants (Super Admin only)
    resources :tenants

    # Cars
    resources :cars do
      member do
        post 'restore', to: 'cars#restore'
        post 'sell', to: 'cars#sell'
        post 'unsell', to: 'cars#unsell'
        post 'rent', to: 'cars#rent'
        post 'return_rental', to: 'cars#return_rental'
        post 'salvage_photos', to: 'cars#add_salvage_photos'
        delete 'salvage_photos/:photo_id', to: 'cars#delete_salvage_photo'
        post 'after_repair_photos', to: 'cars#add_after_repair_photos'
        delete 'after_repair_photos/:photo_id', to: 'cars#delete_after_repair_photo'
        post 'invoices', to: 'cars#add_invoices'
        delete 'invoices/:invoice_id', to: 'cars#delete_invoice'
      end
    end

    # Car Models
    resources :car_models do
      collection do
        get 'active'
      end
    end

    # Expense Categories
    resources :expense_categories do
      collection do
        get 'active'
      end
    end

    # Sellers
    resources :sellers do
      collection do
        get 'active'
      end
    end

    # Payment Methods
    resources :payment_methods do
      collection do
        get 'active'
      end
    end

    # Users (tenant members)
    resources :users, only: [:index]

    # Expenses
    resources :expenses

    # Payments
    resources :payments

    # Rental Transactions
    resources :rental_transactions do
      member do
        post 'complete'
      end
    end
  end
end
