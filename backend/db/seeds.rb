# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

puts "🌱 Seeding BestCar database..."

# Create Super Admin user (no tenant)
# Super admin can manage all tenants and has system-wide access
# Note: In production, you should create a proper tenant for super_admin or handle auth differently
demo_tenant = Tenant.find_or_create_by!(name: 'Demo Salvage Cars') do |tenant|
  tenant.subdomain = 'demo'
  tenant.active = true
end
puts "✅ Demo tenant created: #{demo_tenant.name}"

super_admin = User.find_or_create_by!(username: 'superadmin') do |user|
  user.name = 'Super Administrator'
  user.password = 'superadmin123'
  user.password_confirmation = 'superadmin123'
  user.role = 'super_admin'
  user.tenant = demo_tenant  # Temporarily assign to demo tenant
end
puts "✅ Super Admin user created: username=superadmin, password=superadmin123"

# Create default admin user for demo tenant
admin = User.find_or_create_by!(username: 'admin') do |user|
  user.name = 'Demo Administrator'
  user.password = 'admin123'
  user.password_confirmation = 'admin123'
  user.role = 'admin'
  user.tenant = demo_tenant
end
puts "✅ Admin user created: username=admin, password=admin123 (tenant: #{demo_tenant.name})"

# Create car models for demo tenant
car_models_data = [
  'Toyota Camry',
  'Honda Accord',
  'Ford F-150',
  'Chevrolet Silverado',
  'BMW 3 Series',
  'Mercedes-Benz C-Class',
  'Audi A4',
  'Tesla Model 3',
  'Nissan Altima',
  'Hyundai Sonata'
]

car_models_data.each do |model_name|
  CarModel.find_or_create_by!(name: model_name, tenant: demo_tenant) do |model|
    model.active = true
  end
end
puts "✅ #{car_models_data.count} car models created for #{demo_tenant.name}"

# Create expense categories for demo tenant
expense_categories_data = [
  { name: 'Engine Repair', expense_type: 'reparation' },
  { name: 'Body Work', expense_type: 'reparation' },
  { name: 'Paint Job', expense_type: 'reparation' },
  { name: 'Interior Repair', expense_type: 'reparation' },
  { name: 'Tire Replacement', expense_type: 'reparation' },
  { name: 'Transmission Repair', expense_type: 'reparation' },
  { name: 'Electrical Work', expense_type: 'reparation' },
  { name: 'Auction Fees', expense_type: 'purchase' },
  { name: 'Shipping Costs', expense_type: 'purchase' },
  { name: 'Customs Clearance', expense_type: 'purchase' },
  { name: 'Towing Service', expense_type: 'purchase' },
  { name: 'Insurance', expense_type: 'purchase' },
  { name: 'Storage Fees', expense_type: 'purchase' },
  { name: 'Other', expense_type: 'purchase' }
]

expense_categories_data.each do |data|
  ExpenseCategory.find_or_create_by!(name: data[:name], tenant: demo_tenant) do |category|
    category.expense_type = data[:expense_type]
    category.active = true
  end
end
puts "✅ #{expense_categories_data.count} expense categories created for #{demo_tenant.name}"

# Create sample cars for development environment only
if Rails.env.development?
  camry_model = CarModel.find_by(name: 'Toyota Camry', tenant: demo_tenant)
  accord_model = CarModel.find_by(name: 'Honda Accord', tenant: demo_tenant)

  if camry_model && accord_model
    sample_cars = [
      {
        vin: '1HGCM82633A123456',
        car_model: camry_model,
        year: 2020,
        color: 'Silver',
        mileage: 45000,
        purchase_date: Date.today - 30.days,
        purchase_price: 8500.00,
        seller: 'Copart Auto Auction',
        location: 'Dallas, TX',
        clearance_cost: 450.00,
        towing_cost: 200.00
      },
      {
        vin: '1HGCM82633A789012',
        car_model: accord_model,
        year: 2019,
        color: 'Black',
        mileage: 52000,
        purchase_date: Date.today - 45.days,
        purchase_price: 7800.00,
        seller: 'IAA Auto Auction',
        location: 'Houston, TX',
        clearance_cost: 425.00,
        towing_cost: 180.00
      }
    ]

    sample_cars.each do |data|
      Car.find_or_create_by!(vin: data[:vin], tenant: demo_tenant) do |car|
        car.car_model = data[:car_model]
        car.year = data[:year]
        car.color = data[:color]
        car.mileage = data[:mileage]
        car.purchase_date = data[:purchase_date]
        car.purchase_price = data[:purchase_price]
        car.seller = data[:seller]
        car.location = data[:location]
        car.clearance_cost = data[:clearance_cost]
        car.towing_cost = data[:towing_cost]
      end
    end
    puts "✅ #{sample_cars.count} sample cars created (development only)"
  end
end

puts "✨ Seeding complete!"
puts ""
puts "📝 Login credentials:"
puts "   Super Admin: username=superadmin, password=superadmin123"
puts "   Admin: username=admin, password=admin123"
puts ""
