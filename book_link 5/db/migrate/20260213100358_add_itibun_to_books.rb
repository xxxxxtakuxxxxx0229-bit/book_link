class AddItibunToBooks < ActiveRecord::Migration[8.1]
  def change
        add_column :books, :itibun, :text
  end
end
