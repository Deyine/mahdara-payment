# Create default roles
admin_role = Role.find_or_create_by!(name: 'مشرف') do |r|
  r.description = 'صلاحيات كاملة'
  r.permissions = Permissions::ALL.dup
end

Role.find_or_create_by!(name: 'مشاهد') do |r|
  r.description = 'قراءة البيانات فقط'
  r.permissions = Permissions::ALL.select { |p| p.end_with?(':read') }
end

Role.find_or_create_by!(name: 'مشغّل') do |r|
  r.description = 'إنشاء وتعديل الموظفين والمدفوعات'
  r.permissions = %w[
    employees:read       employees:create     employees:update    employees:export
    contracts:create     contracts:update
    mahdaras:create      mahdaras:update      mahdaras:download
    payment_batches:read payment_batches:create payment_batches:confirm payment_batches:export
    employee_types:read  wilayas:read         moughataa:read
    communes:read        villages:read        banks:read          salary_amounts:read
  ]
end

puts "Roles: #{Role.count} (مشرف, مشاهد, مشغّل)"

# Create default users
User.find_or_create_by!(username: 'superadmin') do |u|
  u.name = 'Super Admin'
  u.password = 'password123'
  u.role = 'super_admin'
  u.active = true
end

# Migrate existing 'admin' role users to 'user' + assigned admin_role
User.where(role: 'admin').find_each do |u|
  u.update!(role: 'user', role_id: admin_role.id)
end

# Ensure the seeded 'admin' user exists with user role + admin_role
User.find_or_create_by!(username: 'admin') do |u|
  u.name = 'Administrateur'
  u.password = 'password123'
  u.role = 'user'
  u.role_id = admin_role.id
  u.active = true
end

puts "Users: #{User.count}"

# Default salary amounts
[3000, 3500, 4000, 5000, 6000, 7000, 8000, 10000, 12000, 15000, 20000].each do |amount|
  SalaryAmount.find_or_create_by!(amount: amount)
end
puts "Salary amounts: #{SalaryAmount.count}"
