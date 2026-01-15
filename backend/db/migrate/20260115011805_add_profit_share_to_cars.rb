class AddProfitShareToCars < ActiveRecord::Migration[8.0]
  def change
    add_reference :cars, :profit_share_user, foreign_key: { to_table: :users }, type: :bigint
    add_column :cars, :profit_share_percentage, :decimal, precision: 5, scale: 2, default: 0
  end
end
