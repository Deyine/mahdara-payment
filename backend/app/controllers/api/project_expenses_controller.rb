require 'csv'

class Api::ProjectExpensesController < ApplicationController
  include MultiTenantable

  before_action :authenticate_user!
  before_action :require_admin
  before_action :set_expense, only: [:show, :update, :destroy]

  def index
    expenses_scope = tenant_scope(ProjectExpense).includes(:project, :project_expense_category)

    if params[:project_id].present?
      expenses_scope = expenses_scope.for_project(params[:project_id])
    end

    @expenses = expenses_scope.all
    render json: @expenses
  end

  def show
    render json: @expense
  end

  def create
    @expense = tenant_scope(ProjectExpense).new(expense_params)
    @expense.tenant = current_tenant

    if @expense.save
      render json: @expense, status: :created
    else
      render json: { errors: @expense.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @expense.update(expense_params)
      render json: @expense
    else
      render json: { errors: @expense.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @expense.destroy
    head :no_content
  end

  def import
    unless params[:file].present? && params[:project_id].present?
      render json: { error: 'Fichier CSV et ID de projet requis' }, status: :unprocessable_entity
      return
    end

    # Find project
    project = tenant_scope(Project).find_by(id: params[:project_id])
    unless project
      render json: { error: 'Projet non trouvé' }, status: :not_found
      return
    end

    # Find or create "Import" category
    import_category = tenant_scope(ProjectExpenseCategory).find_or_create_by(
      name: 'Import'
    ) do |category|
      category.tenant = current_tenant
      category.description = 'Catégorie pour les dépenses importées'
      category.active = true
    end

    imported_count = 0
    errors = []

    begin
      csv_content = params[:file].read.force_encoding('UTF-8')

      # Auto-detect separator by counting occurrences in first line
      first_line = csv_content.lines.first || ''
      comma_count = first_line.count(',')
      semicolon_count = first_line.count(';')
      separator = semicolon_count > comma_count ? ';' : ','

      CSV.parse(csv_content, headers: true, col_sep: separator) do |row|
        # Expected columns: date, description, amount
        expense_date = row['date'] || row['Date']
        description = row['description'] || row['Description']
        raw_amount = row['amount'] || row['Amount'] || row['Montant']

        if expense_date.blank? || raw_amount.blank?
          errors << "Ligne ignorée: date ou montant manquant"
          next
        end

        # Clean amount: remove all whitespace including non-breaking spaces, and handle comma as decimal
        cleaned_amount = raw_amount.to_s
          .gsub(/[[:space:]]/, '')  # Remove all Unicode whitespace (including non-breaking spaces)
          .gsub(/[^\d.,\-]/, '')    # Keep only digits, dots, commas, minus
          .gsub(',', '.')           # Replace comma with dot for decimal

        Rails.logger.debug "[ProjectExpenses Import] Amount: '#{raw_amount}' -> '#{cleaned_amount}'"

        expense = tenant_scope(ProjectExpense).new(
          tenant: current_tenant,
          project: project,
          project_expense_category: import_category,
          expense_date: expense_date,
          description: description,
          amount: cleaned_amount
        )

        if expense.save
          imported_count += 1
        else
          error_msg = "Erreur ligne: #{expense.errors.full_messages.join(', ')}"
          errors << error_msg
          Rails.logger.warn "[ProjectExpenses Import] #{error_msg}"
        end
      end

      Rails.logger.info "[ProjectExpenses Import] Completed: #{imported_count} imported, #{errors.size} errors"

      render json: {
        message: "#{imported_count} dépense(s) importée(s) avec succès",
        imported: imported_count,
        errors: errors
      }, status: :ok

    rescue CSV::MalformedCSVError => e
      Rails.logger.error "[ProjectExpenses Import] CSV Malformed: #{e.message}"
      render json: { error: "Fichier CSV invalide: #{e.message}" }, status: :unprocessable_entity
    rescue => e
      Rails.logger.error "[ProjectExpenses Import] Exception: #{e.class} - #{e.message}\n#{e.backtrace.first(5).join("\n")}"
      render json: { error: "Erreur lors de l'import: #{e.message}" }, status: :unprocessable_entity
    end
  end

  private

  def set_expense
    @expense = tenant_scope(ProjectExpense).find(params[:id])
  end

  def expense_params
    params.require(:project_expense).permit(
      :project_id, :project_expense_category_id, :amount, :expense_date, :description
    )
  end
end
