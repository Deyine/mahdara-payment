class Api::DebtsController < ApplicationController
  include MultiTenantable

  before_action :authenticate_user!
  before_action :require_admin
  before_action :set_debt, only: [:show, :update, :destroy]

  def index
    debts_scope = tenant_scope(Debt).includes(:user)

    # Filter by user_id
    if params[:user_id].present?
      debts_scope = debts_scope.for_user(params[:user_id])
    end

    # Filter by direction
    if params[:direction].present?
      debts_scope = debts_scope.where(direction: params[:direction])
    end

    @debts = debts_scope.recent
    render json: @debts.map { |debt| DebtSerializer.new(debt).as_json }
  end

  def show
    render json: DebtSerializer.new(@debt).as_json
  end

  def create
    @debt = tenant_scope(Debt).new(debt_params)
    @debt.tenant = current_tenant

    if @debt.save
      render json: DebtSerializer.new(@debt).as_json, status: :created
    else
      render json: { errors: @debt.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @debt.update(debt_params)
      render json: DebtSerializer.new(@debt).as_json
    else
      render json: { errors: @debt.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @debt.destroy
    render json: { message: 'Debt deleted successfully' }
  end

  # GET /api/debts/summary - Returns totals for dashboard
  def summary
    debts = tenant_scope(Debt)

    total_we_lent = debts.we_lent.sum(:amount).to_f
    total_we_borrowed = debts.we_borrowed.sum(:amount).to_f

    render json: {
      total_we_lent: total_we_lent,
      total_we_borrowed: total_we_borrowed,
      net_balance: total_we_lent - total_we_borrowed
    }
  end

  # POST /api/debts/import - Import debts from CSV
  def import
    require 'csv'

    unless params[:file].present?
      return render json: { errors: ['No file provided'] }, status: :unprocessable_entity
    end

    unless params[:debtor_name].present?
      return render json: { errors: ['Debtor name is required'] }, status: :unprocessable_entity
    end

    debtor_name = params[:debtor_name]
    user_id = params[:user_id].present? ? params[:user_id].to_i : nil

    file = params[:file]
    imported_count = 0
    errors = []

    begin
      csv_text = file.read.force_encoding('UTF-8')
      csv = CSV.parse(csv_text, headers: true)

      csv.each_with_index do |row, index|
        begin
          # Parse amount (remove currency prefix and commas, convert from MRO to MRU)
          amount_str = row['Amount'].to_s.gsub(/[A-Z]+/, '').gsub(',', '').strip
          amount_mro = amount_str.to_f
          amount_mru = amount_mro / 10.0

          # Parse date
          debt_date = Date.parse(row['Creation date'])

          # Parse direction based on Type (from company perspective)
          type = row['Type'].to_s.strip
          direction = case type
                      when 'I owe'
                        'we_borrowed'  # Company owes them
                      when 'Owes me'
                        'we_lent'  # They owe the company
                      else
                        next # Skip rows with unknown type
                      end

          # Create debt
          debt = tenant_scope(Debt).new(
            debtor_name: debtor_name,
            user_id: user_id,
            direction: direction,
            amount: amount_mru,
            debt_date: debt_date,
            notes: row['Concept']
          )
          debt.tenant = current_tenant

          if debt.save
            imported_count += 1
          else
            errors << "Row #{index + 2}: #{debt.errors.full_messages.join(', ')}"
          end
        rescue => e
          errors << "Row #{index + 2}: #{e.message}"
        end
      end

      render json: {
        message: "Import completed: #{imported_count} debts imported",
        imported_count: imported_count,
        errors: errors
      }, status: :ok
    rescue CSV::MalformedCSVError => e
      render json: { errors: ["Invalid CSV format: #{e.message}"] }, status: :unprocessable_entity
    rescue => e
      render json: { errors: ["Import failed: #{e.message}"] }, status: :unprocessable_entity
    end
  end

  private

  def set_debt
    @debt = tenant_scope(Debt).find(params[:id])
  end

  def debt_params
    params.require(:debt).permit(
      :debtor_name, :user_id, :direction, :amount, :debt_date, :notes
    )
  end

  def require_admin
    unless current_user&.admin? || current_user&.super_admin?
      render json: { error: 'Forbidden' }, status: :forbidden
    end
  end
end
