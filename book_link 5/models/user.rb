class User < ActiveRecord::Base
  has_many :books, -> { order(created_at: :desc) }
  
  # フォロー関係
  has_many :active_relationships, class_name: "Follow", foreign_key: "follower_id", dependent: :destroy
  has_many :following, through: :active_relationships, source: :followed

  # 総読書時間の計算（秒）
  def total_reading_time
    books.sum(:reading_time_seconds) || 0
  end

  # AIレコメンデーション（簡易ロジック）
  # 実際にはここにPythonのMLモデルAPIを叩く処理や、ベクトル検索が入ります。
  # 今回は「自分以外」かつ「まだフォローしていない」ユーザーからランダムに抽出することで模倣します。
  def recommended_users
    User.where.not(id: self.id)
        .where.not(id: self.following.pluck(:id))
        .limit(5)
        .order("RANDOM()") 
        # ※本来はここで「読書時間」や「ジャンル」の一致度でソートします
  end
end