Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    post 'auth/login', to: 'auth#login'
    get 'dashboard/statistics', to: 'dashboard#statistics'

    resources :roles
    resources :users
    resources :employee_types do
      resources :document_templates, only: [:create, :destroy]
    end
    resources :banks
    resources :employees do
      collection do
        get 'lookup_nni'
        get 'export'
      end
      resources :employee_documents, only: [:update, :destroy]
    end
    resources :mahdaras, only: [:create, :update] do
      member { get 'document' }
    end
    resources :salary_amounts, only: [:index, :create, :destroy]
    resources :contracts, only: [:create, :update, :destroy]
    resources :wilayas do
      collection { post 'import' }
    end
    resources :moughataa do
      collection { post 'import' }
    end
    resources :communes do
      collection { post 'import' }
    end
    resources :villages do
      collection { post 'import' }
    end
    resources :payment_batches, only: [:index, :show, :create, :destroy] do
      member do
        patch 'confirm'
        patch 'revert'
        get   'export'
      end
    end
  end
end
