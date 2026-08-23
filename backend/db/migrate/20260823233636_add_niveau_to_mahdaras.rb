class AddNiveauToMahdaras < ActiveRecord::Migration[8.0]
  def change
    add_column :mahdaras, :niveau, :string
  end
end
