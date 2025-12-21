class Api::CarModelsController < ApplicationController
  include MultiTenantable

  before_action :authenticate_user!
  before_action :require_admin, except: [:index, :active]
  before_action :set_car_model, only: [:show, :update, :destroy]

  def index
    @car_models = tenant_scope(CarModel).all
    render json: @car_models
  end

  def active
    @car_models = tenant_scope(CarModel).active
    render json: @car_models
  end

  def show
    render json: @car_model
  end

  def create
    @car_model = tenant_scope(CarModel).new(car_model_params)
    @car_model.tenant = current_tenant

    if @car_model.save
      render json: @car_model, status: :created
    else
      render json: { errors: @car_model.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @car_model.update(car_model_params)
      render json: @car_model
    else
      render json: { errors: @car_model.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    if @car_model.cars.exists?
      render json: { error: 'Cannot delete car model with existing cars' }, status: :unprocessable_entity
    else
      @car_model.destroy
      head :no_content
    end
  end

  private

  def set_car_model
    @car_model = tenant_scope(CarModel).find(params[:id])
  end

  def car_model_params
    params.require(:car_model).permit(:name, :active)
  end

  def require_admin
    unless current_user&.admin? || current_user&.super_admin?
      render json: { error: 'Forbidden' }, status: :forbidden
    end
  end
end
