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
