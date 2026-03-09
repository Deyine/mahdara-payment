# Mahdara - Operating Rules & Business Logic

## Single-Tenant Architecture

**No multi-tenancy.** All models are queried directly — no `tenant_id`, no scoping by tenant.

```ruby
# Correct
def index
  @employees = Employee.includes(:employee_type).order(:last_name, :first_name)
end

# Wrong — do NOT use
def index
  @employees = tenant_scope(Employee)  # MultiTenantable is removed
end
```

The `MultiTenantable` concern does not exist in this project.

---

## NNI (National ID)

- NNI is unique globally across all employees
- Format: 10 numeric digits, checksum: `NNI % 97 == 1`
- Looked up via **Huwiyeti Gov API**: `HuwiyetiService#get_person_by_nni(nni)`
- API endpoint: `POST https://api-houwiyeti.anrpts.gov.mr/houwiyetiapi/v1/partners/getPersonne`
- Auth header: `entity-api-key` (configured via `HUWIYETI_API_KEY` env var)
- Response maps: `prenomFr` → `first_name`, `patronymeFr` → `last_name`, `dateNaissance` → `birth_date`
- Lookup is the **only way** to populate identity fields — manual entry is not allowed
- Identity fields (`nni`, `first_name`, `last_name`, `birth_date`) are read-only in the UI after lookup
- Backend `update` action ignores these fields even if sent (`employee_update_params` excludes them)

---

## Contract Rules

### One Active Contract Per Employee
An employee should have at most one active contract. When creating a new contract, manually deactivate the previous one (no automatic enforcement in the model — controlled in the UI).

### CDI vs CDD
- **CDI** (unlimited): `duration_months` is null/nil
- **CDD** (fixed term): `duration_months` must be a positive integer

```ruby
validates :duration_months, presence: true, if: -> { contract_type == 'CDD' }
```

### Amount
The `amount` field on the contract is the employee's **monthly salary** in MRU.

---

## Payment Batch Rules

### Composition
Each `PaymentBatchEmployee` record has:
- `employee_id` — the employee
- `amount` — the monthly amount (copied from contract at time of batch creation)
- `months_count` — number of months being paid (minimum 1)

### Total Calculation
`total` on the batch is computed on the fly (not stored):
```ruby
total = payment_batch_employees.sum { |pbe| pbe.amount.to_f * pbe.months_count }
```

Frontend live preview:
```javascript
const total = useMemo(() =>
  Object.entries(selected).reduce((sum, [, data]) =>
    sum + parseFloat(data.amount) * data.months_count, 0), [selected]);
```

### Status
- `draft` — can be deleted
- `confirmed` — immutable

### Deletion
Only `draft` batches can be deleted.

---

## Location Hierarchy Rules

### Cascade
Wilaya → Moughataa → Commune → Village. Each level belongs to its parent.

### Table Name
The `moughataa` table uses the exact name `"moughataa"` (not `"moughataas"`).
This requires:
1. `inflect.uncountable 'moughataa'` in `config/initializers/inflections.rb`
2. All `t.references :moughataa` with `foreign_key: { to_table: :moughataa }`

### Cascade Deletion Constraint
- Cannot delete Wilaya if it has Moughataa (`dependent: :restrict_with_error`)
- Cannot delete Moughataa if it has Communes
- Cannot delete Commune if it has Villages

### CSV Import
Auto-detect separator (`;` vs `,`). Return `{ imported:, skipped:, errors: }`.

**Wilayas CSV**: `name`, `code` (optional)
**Moughataa CSV**: `name`, `wilaya` (looked up by name)
**Communes CSV**: `name`, `moughataa` (looked up by name)
**Villages CSV**: `name`, `commune` (looked up by name)

Duplicates are skipped (not errors). Unknown parent names produce an error entry.

---

## User / Role Rules

- `super_admin`: Can do everything, can create/delete admins
- `admin`: Full CRUD, cannot promote to super_admin
- `user`: Read-only

Restrictions:
- Cannot modify own role
- Cannot delete own account
- Only super_admin can delete another super_admin

---

## Controller Pattern (no serializers)

This project uses **inline serialization** in controllers — no dedicated serializer classes.

```ruby
def index
  @employees = Employee.includes(:employee_type, :wilaya).order(:last_name)
  render json: @employees.map { |e| employee_json(e) }
end

private

def employee_json(e, full: false)
  data = {
    id: e.id, nni: e.nni, full_name: e.full_name,
    employee_type: e.employee_type ? { id: e.employee_type.id, name: e.employee_type.name } : nil,
    # ...
  }
  data[:contracts] = e.contracts.map { |c| contract_json(c) } if full
  data
end
```

---

## CSV Import Controller Pattern

```ruby
def import
  file = params[:file]
  return render json: { error: 'Fichier requis' }, status: :bad_request unless file

  content = file.read.force_encoding('UTF-8')
  sep = content.lines.first.to_s.count(';') > content.lines.first.to_s.count(',') ? ';' : ','
  imported = 0; skipped = 0; errors = []

  require 'csv'
  CSV.parse(content, headers: true, col_sep: sep) do |row|
    name = row['name']&.strip
    next if name.blank?
    record = Model.find_or_initialize_by(name: name)
    if record.new_record?
      record.save ? imported += 1 : errors << "#{name}: #{record.errors.full_messages.join(', ')}"
    else
      skipped += 1
    end
  end

  render json: { imported: imported, skipped: skipped, errors: errors }
end
```
