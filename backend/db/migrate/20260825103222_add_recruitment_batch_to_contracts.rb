class AddRecruitmentBatchToContracts < ActiveRecord::Migration[8.0]
  def change
    add_column :contracts, :recruitment_batch, :string
    add_index :contracts, :recruitment_batch
  end
end
