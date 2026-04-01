# Create default users
User.find_or_create_by!(username: 'superadmin') do |u|
  u.name = 'Super Admin'
  u.password = 'password123'
  u.role = 'super_admin'
  u.active = true
end

User.find_or_create_by!(username: 'admin') do |u|
  u.name = 'Administrateur'
  u.password = 'password123'
  u.role = 'admin'
  u.active = true
end

puts "Seed completed: #{User.count} users"

# Default salary amounts
[2000, 3000, 3500, 4000, 5000, 6000, 7000, 8000, 10000, 12000, 15000].each do |amount|
  SalaryAmount.find_or_create_by!(amount: amount)
end
puts "Salary amounts: #{SalaryAmount.count}"
