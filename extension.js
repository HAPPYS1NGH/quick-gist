const vscode = require("vscode")
const axios = require("axios")
const Credentials = require("./credentials")
require("dotenv").config({ path: __dirname + "/.env.local" })

async function activate(context) {
  console.log('Congratulations, your extension "quick-gist" is now active!')

  // Create a new instance of the Credentials class for authorization
  const octokit = await authenticateGithub(context)

  let fileGistDisposable = vscode.commands.registerCommand(
    "quick-gist.publishFile",
    async () => {
      const editor = vscode.window.activeTextEditor
      if (editor) {
        try {
          const fileUri = editor.document.uri
          const fileContent = await vscode.workspace.fs.readFile(fileUri)
          // Get the file name from the file path and use it not available then use Readme.md
          const fileName =
            editor.document.fileName.split("/").pop() || "Readme.md"
          // Convert the buffer to a string (assuming it's a text file)
          const contentString = Buffer.from(fileContent).toString("utf-8")

          const gistURL = await createGist(contentString, fileName, octokit)
          showGistDetails(gistURL)
        } catch (error) {
          console.error("Error reading file:", error.message)
          vscode.window.showErrorMessage(
            `Failed to create Gist. \n ${error.message}`
          )
        }
      }
    }
  )
  let fileShortGistDisposable = vscode.commands.registerCommand(
    "quick-gist.shortenAndPublishFile",
    async () => {
      const editor = vscode.window.activeTextEditor
      if (editor) {
        try {
          const fileUri = editor.document.uri
          const fileContent = await vscode.workspace.fs.readFile(fileUri)
          // Get the file name from the file path and use it not available then use Readme.md
          const fileName =
            editor.document.fileName.split("/").pop() || "Readme.md"
          // Convert the buffer to a string (assuming it's a text file)
          const contentString = Buffer.from(fileContent).toString("utf-8")

          const gistURL = await createGist(contentString, fileName, octokit)
          const url = await shortenUrl(gistURL)

          showGistShortenDetails(gistURL, url)
        } catch (error) {
          console.error("Error reading file:", error.message)
          vscode.window.showErrorMessage(
            `Failed to create Gist. \n ${error.message}`
          )
        }
      }
    }
  )

  let selectedGistDisposable = vscode.commands.registerCommand(
    "quick-gist.publishSelection",
    async () => {
      const editor = vscode.window.activeTextEditor
      if (editor) {
        try {
          // Get the selected text from the active editor
          const contentString = editor.document.getText(editor.selection)
          const fileName =
            editor.document.fileName.split("/").pop() || "Readme.md"

          const gistURL = await createGist(contentString, fileName, octokit)
          showGistDetails(gistURL)
        } catch (error) {
          console.error("Error reading file:", error.message)
          vscode.window.showErrorMessage(
            `Failed to create Gist. \n ${error.message}`
          )
        }
      }
    }
  )

  let selectedShortenGistDisposable = vscode.commands.registerCommand(
    "quick-gist.shortenAndPublishSelection",
    async () => {
      const editor = vscode.window.activeTextEditor
      if (editor) {
        try {
          // Get the selected text from the active editor
          const contentString = editor.document.getText(editor.selection)
          const fileName =
            editor.document.fileName.split("/").pop() || "Readme.md"

          const gistURL = await createGist(contentString, fileName, octokit)
          const url = await shortenUrl(gistURL)

          showGistShortenDetails(gistURL, url)
        } catch (error) {
          console.error("Error reading file:", error.message)
          vscode.window.showErrorMessage(
            `Failed to create Gist. \n ${error.message}`
          )
        }
      }
    }
  )

  // Push the disposables to the context.subscription array
  context.subscriptions.push(
    fileGistDisposable,
    selectedGistDisposable,
    fileShortGistDisposable,
    selectedShortenGistDisposable
  )
}

// Authenticate with GitHub using the credentials
const authenticateGithub = async (context) => {
  const credentials = new Credentials()
  await credentials.initialize(context)
  const octokit = await credentials.getOctokit()
  return octokit
}

//Publish the file to GitHub Gist
const createGist = async (contentString, fileName, octokit) => {
  const response = await octokit.rest.gists.create({
    public: true,
    files: {
      [fileName]: {
        content: contentString,
      },
    },
  })
  return response.data.html_url
}

// Shorten the URL using the RapidAPI
async function shortenUrl(url) {
  const options = {
    method: "POST",
    url: "https://fast-url-shortener1.p.rapidapi.com/shorten",
    headers: {
      "content-type": "application/json",
      "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
      "X-RapidAPI-Host": "fast-url-shortener1.p.rapidapi.com",
    },
    data: {
      url: url,
    },
  }
  const response = await axios.request(options)
  return response.data.shortened
}

async function showGistDetails(gistURL) {
  const action = await vscode.window.showInformationMessage(
    "Gist created successfully!",
    "Copy Gist URL",
    "Visit Gist"
  )

  if (action === "Copy Gist URL") {
    vscode.env.clipboard.writeText(gistURL)
  } else if (action === "Visit Gist") {
    vscode.env.openExternal(vscode.Uri.parse(gistURL))
  }
  vscode.window.showInformationMessage(`Gist URL is ${gistURL}`)
}

async function showGistShortenDetails(gistURL, shortURL) {
  const action = await vscode.window.showInformationMessage(
    "Gist created successfully!",
    "Copy Short URL",
    "Visit Gist"
  )

  if (action === "Copy Short URL") {
    vscode.env.clipboard.writeText(shortURL)
  } else if (action === "Visit Gist") {
    vscode.env.openExternal(vscode.Uri.parse(gistURL))
  }
  vscode.window.showInformationMessage(`Short URL is ${shortURL}`)
  vscode.window.showInformationMessage(`Gist URL is ${gistURL}`)
}
// Export the activate functions
module.exports = {
  activate,
}
