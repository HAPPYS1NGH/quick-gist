const vscode = require("vscode")
const Octokit = require("@octokit/rest")

const GITHUB_AUTH_PROVIDER_ID = "github"
const SCOPES = ["gist"]

class Credentials {
  constructor() {
    this.octokit = undefined
  }

  async initialize(context) {
    this.registerListeners(context)
    await this.setOctokit()
  }

  async setOctokit() {
    const session = await vscode.authentication.getSession(
      GITHUB_AUTH_PROVIDER_ID,
      SCOPES,
      { createIfNone: false }
    )

    if (session) {
      this.octokit = new Octokit.Octokit({
        auth: session.accessToken,
      })
      console.log("session", session)
      return
    }

    this.octokit = undefined
  }

  registerListeners(context) {
    context.subscriptions.push(
      vscode.authentication.onDidChangeSessions(async (e) => {
        if (e.provider.id === GITHUB_AUTH_PROVIDER_ID) {
          await this.setOctokit()
        }
      })
    )
  }

  async getOctokit() {
    if (this.octokit) {
      return this.octokit
    }

    const session = await vscode.authentication.getSession(
      GITHUB_AUTH_PROVIDER_ID,
      SCOPES,
      { createIfNone: true }
    )
    this.octokit = new Octokit.Octokit({
      auth: session.accessToken,
    })

    return this.octokit
  }
}

module.exports = Credentials
