class AddDetailsToBooks < ActiveRecord::Migration[8.1]
  def change
    add_column :books, :impression, :text
    add_column :books, :recommended_person, :string
  end
end
