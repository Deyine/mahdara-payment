namespace :products do
  desc "Recalculate cost_price for all products based on completed purchases"
  task recalculate_cost_prices: :environment do
    puts "=" * 70
    puts "Recalculating cost prices for all products..."
    puts "=" * 70
    puts ""

    products = Product.all
    total_count = products.count
    updated_count = 0
    unchanged_count = 0

    if total_count.zero?
      puts "No products found in the database."
      exit
    end

    products.each_with_index do |product, index|
      old_cost = product.cost_price

      # Recalculate
      product.recalculate_cost_price!
      product.reload

      new_cost = product.cost_price

      # Display result
      if old_cost != new_cost
        puts "[#{index + 1}/#{total_count}] ✓ #{product.name} (SKU: #{product.sku})"
        puts "  Old cost: #{old_cost.to_f.round(2)} MRU → New cost: #{new_cost.to_f.round(2)} MRU"
        puts "  Stock: #{product.current_stock} units | Stock value: #{product.stock_value.to_f.round(2)} MRU"
        updated_count += 1
      else
        puts "[#{index + 1}/#{total_count}] - #{product.name} (SKU: #{product.sku})"
        puts "  Cost price unchanged: #{new_cost.to_f.round(2)} MRU"
        unchanged_count += 1
      end
      puts ""
    end

    puts "=" * 70
    puts "Summary:"
    puts "  Total products: #{total_count}"
    puts "  Updated: #{updated_count}"
    puts "  Unchanged: #{unchanged_count}"
    puts "=" * 70
    puts ""
    puts "Done! All cost prices have been recalculated."
  end
end
