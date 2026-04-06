module Permissions
  ALL = %w[
    employees:read        employees:create      employees:update
    employees:delete      employees:export
    contracts:create      contracts:update      contracts:delete
    mahdaras:create       mahdaras:update       mahdaras:download
    payment_batches:read  payment_batches:create  payment_batches:confirm
    payment_batches:delete  payment_batches:export
    employee_types:read   employee_types:create   employee_types:update   employee_types:delete
    wilayas:read          wilayas:create          wilayas:update          wilayas:delete          wilayas:import
    moughataa:read        moughataa:create        moughataa:update        moughataa:delete        moughataa:import
    communes:read         communes:create         communes:update         communes:delete         communes:import
    villages:read         villages:create         villages:update         villages:delete         villages:import
    banks:read            banks:create            banks:update            banks:delete
    salary_amounts:read   salary_amounts:create   salary_amounts:delete
    users:read            users:create            users:update            users:delete
    roles:read            roles:create            roles:update            roles:delete
  ].freeze

  BY_ENTITY = ALL.group_by { |p| p.split(':').first }.freeze
end
