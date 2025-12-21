module MultiTenantable
  extend ActiveSupport::Concern

  included do
    before_action :set_tenant
  end

  private

  def set_tenant
    @current_tenant = current_user&.tenant
  end

  def current_tenant
    @current_tenant
  end

  def tenant_scope(model_class)
    return model_class.none unless current_tenant
    model_class.for_tenant(current_tenant.id)
  end
end
