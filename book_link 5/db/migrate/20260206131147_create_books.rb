class CreateBooks < ActiveRecord::Migration[8.1]
  def change
    create_table :books do |t|
      t.references :user, foreign_key: true
      t.string :title
      t.string :author
      t.integer :page_count
      t.integer :reading_time_seconds # 読書時間を記録
      t.timestamps
    end
  end
end
