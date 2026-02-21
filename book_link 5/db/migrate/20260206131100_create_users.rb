class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :name
      t.string :icon_url
      t.text :bio
      t.timestamps
    end
  end
end
