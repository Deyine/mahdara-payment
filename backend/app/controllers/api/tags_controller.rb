class Api::TagsController < ApplicationController
  include MultiTenantable

  before_action :authenticate_user!
  before_action :require_admin, except: [:index]
  before_action :set_tag, only: [:show, :update, :destroy]

  def index
    @tags = tenant_scope(Tag).all
    render json: @tags
  end

  def show
    render json: @tag
  end

  def create
    @tag = tenant_scope(Tag).new(tag_params)
    @tag.tenant = current_tenant

    if @tag.save
      render json: @tag, status: :created
    else
      render json: { errors: @tag.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @tag.update(tag_params)
      render json: @tag
    else
      render json: { errors: @tag.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    if @tag.cars.exists?
      render json: { error: 'Cannot delete tag with associated cars' }, status: :unprocessable_entity
    else
      @tag.destroy
      head :no_content
    end
  end

  private

  def set_tag
    @tag = tenant_scope(Tag).find(params[:id])
  end

  def tag_params
    params.require(:tag).permit(:name, :color)
  end
end
