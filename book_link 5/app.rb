require 'sinatra'
require 'sinatra/activerecord'
require 'sinatra/json'
require './models/user'
require './models/book'
require './models/follow'

set :database_file, 'config/database.yml'
set :public_folder, 'public'

set :bind, '0.0.0.0'
set :port, 8080

set :host_authorization, {permitted_hosts: ["19bd27676d9946f7bbe22ec1f940e9db.vfs.cloud9.ap-northeast-1.amazonaws.com"]}

# 簡易的なログイン機能（今回はID:1のユーザーとして振る舞う）
before do
  # テスト用にユーザーがいなければ作成
  if User.count == 0
    User.create(name: "自分", bio: "読書が好きです。", icon_url: "https://placehold.co/100")
    5.times { |i| User.create(name: "User#{i}", bio: "User#{i}のbio", icon_url: "https://placehold.co/100") }
  end
  @current_user = User.first
end

# メインページ
get '/' do
  @favorites = @current_user.following
  @recommendations = @current_user.recommended_users
  # 初期表示は自分のプロファイル
  @display_user = @current_user 
  @is_following = false
  erb :index
end

# 読書ログの記録
post '/books' do
  content_type :json
  book = @current_user.books.new(
    title: params[:title],
    author: params[:author],
    page_count: params[:page_count],
    reading_time_seconds: params[:duration]
  )
  if book.save
    book.to_json
  else
    status 400
    { error: "Failed to save" }.to_json
  end
end

post '/books' do
  # 既存の本を探す
  book = current_user.books.find_by(title: params[:title], author: params[:author])

  if book
    # あれば時間を足す
    book.reading_time_seconds += params[:duration].to_i
    book.page_count += params[:page_count].to_i
    book.save
  else
    # なければ新規作成
    current_user.books.create(
      title: params[:title],
      author: params[:author],
      page_count: params[:page_count],
      reading_time_seconds: params[:duration]
    )
  end
  # ...
end

# ユーザー情報の取得（右側のパネル切り替え用）
get '/users/:id/profile' do
  @display_user = User.find(params[:id])
  erb :profile_part, layout: false
end

delete '/books/:id' do
  content_type :json
  # 必ず @current_user の本の中から探す（他人の本を消せないようにするため）
  book = @current_user.books.find_by(id: params[:id])
  
  if book
    book.destroy # データベースから削除
    { success: true }.to_json
  else
    status 404
    { error: "Book not found" }.to_json
  end
end

put '/books/:id' do
  content_type :json
  # 必ず @current_user の本の中から探す（他人の本を勝手に編集させないため）
  book = @current_user.books.find_by(id: params[:id])

  if book
    # フォームから送られてきたデータで情報を更新
    if book.update(
      title: params[:title],
      author: params[:author],
      impression: params[:impression],         # ← 追加したカラム
      recommended_person: params[:recommended_person],
      itibun: params[:itibun],# ← 追加したカラム
    )
      { success: true, book: book }.to_json
    else
      status 400
      { error: "更新に失敗しました" }.to_json
    end
  else
    status 404
    { error: "本が見つかりません" }.to_json
  end
end

post '/users/:id/follow' do
  content_type :json
  user = User.find(params[:id])
  
  # 既にフォローしてるかチェック
  current_follow = Follow.find_by(follower_id: @current_user.id, followed_id: user.id)

  if current_follow
    # フォロー解除
    current_follow.destroy
    # 返すデータ：解除したよ、という情報
    { followed: false, id: user.id }.to_json
  else
    # フォロー登録
    Follow.create(follower_id: @current_user.id, followed_id: user.id)
    # 返すデータ：登録したよ＋「名前とアイコン」の情報
    { 
      followed: true, 
      user: { 
        id: user.id, 
        name: user.name, 
        icon_url: user.icon_url 
      } 
    }.to_json
  end
end