module Api
  class AuditLogsController < ApplicationController
    before_action :authenticate_user!
    before_action :require_super_admin

    def index
      scope = PaperTrail::Version.order(created_at: :desc)
      scope = scope.where(item_type: params[:item_type]) if params[:item_type].present?
      scope = scope.where(event: params[:event])         if params[:event].present?
      scope = scope.where(whodunnit: params[:whodunnit])  if params[:whodunnit].present?
      scope = apply_created_at_range(scope, params)

      total = scope.unscope(:order).count

      versions = if params[:per_page] == 'all'
        scope
      else
        per_page = 20
        page     = [params[:page].to_i, 1].max
        scope.offset((page - 1) * per_page).limit(per_page)
      end

      user_ids    = versions.map(&:whodunnit).compact.uniq
      users_by_id = User.where(id: user_ids).index_by(&:id)

      render json: {
        audit_logs: AuditLogSerializer.many(versions, users_by_id: users_by_id),
        meta: { total: total, page: page || 1, per_page: per_page || total, total_pages: per_page ? (total.to_f / per_page).ceil : 1 }
      }
    end

    private

    def apply_created_at_range(scope, params)
      if params[:created_from].present?
        from = Date.parse(params[:created_from]).beginning_of_day
        scope = scope.where('versions.created_at >= ?', from)
      end
      if params[:created_to].present?
        to = Date.parse(params[:created_to]).end_of_day
        scope = scope.where('versions.created_at <= ?', to)
      end
      scope
    rescue ArgumentError
      scope
    end
  end
end
