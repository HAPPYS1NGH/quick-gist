const vscode = require("vscode")
const axios = require("axios")
const Credentials = require("./credentials")
require("dotenv").config({ path: __dirname + "/.env.local" })

async function activate(context) {
  console.log('Congratulations, your extension "short-gist" is now active!')

  // Create a new instance of the Credentials class for authorization
  const octokit = await authenticateGithub(context)

  // Register the "short-gist.readFile" command
  let readFileDisposable = vscode.commands.registerCommand(
    "short-gist.publishFile",
    async () => {
      // Get the active text editor
      const editor = vscode.window.activeTextEditor
      if (editor) {
        const fileUri = editor.document.uri
        try {
          const fileContent = await vscode.workspace.fs.readFile(fileUri)
          // Get the file name from the file path and use it not available then use Readme.md
          const fileName =
            editor.document.fileName.split("/").pop() || "Readme.md"
          // Convert the buffer to a string (assuming it's a text file)
          const contentString = Buffer.from(fileContent).toString("utf-8")

          // Create a new Gist using the content of the file
          const gistURL = await createGist(contentString, fileName, octokit)

          // Shorten the Gist URL using the RapidAPI
          const url = await shortenUrl(gistURL)

          // Display the Shortened URL to the user along with Gist URL
          vscode.window.showInformationMessage(
            "Gist created successfully! " +
              gistURL +
              " \n Shortened URL: " +
              url
          )
        } catch (error) {
          console.error("Error reading file:", error.message)
          vscode.window.showErrorMessage(
            "Failed to read or create Gist. See the console for details."
          )
        }
      }
    }
  )
  // Push the disposables to the context.subscription array
  context.subscriptions.push(readFileDisposable)
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

// Export the activate functions
module.exports = {
  activate,
}
