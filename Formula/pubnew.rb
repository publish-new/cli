class Pubnew < Formula
  desc "CLI for publish.new — publish, discover, and buy digital artifacts with x402 micropayments"
  homepage "https://github.com/publish-new/cli"
  url "https://registry.npmjs.org/@publish-new/cli/-/cli-0.1.0.tgz"
  sha256 "df3394e60ce39307eea3539fb4daac1aff99877e1f1137d4e9a24888a2153914"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match "publish", shell_output("#{bin}/publish --help")
    assert_match version.to_s, shell_output("#{bin}/publish --version")
  end
end
