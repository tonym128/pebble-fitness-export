module.exports = [
  {
    "type": "heading",
    "defaultValue": "Health Export App Configuration"
  },
  {
    "type": "text",
    "defaultValue": "Setup for Uploads."
  },
  {
    "type": "section",
    "items": [
      {
        "type": "heading",
        "defaultValue": "Upload API"
      },
      {
        "type": "input",
        "messageKey": "cfgEndpoint",
        "defaultValue": "10.0.0.25/v1/health_records/batch_create",
        "label": "Endpoint"
      },
      {
        "type": "input",
        "messageKey": "cfgAuthToken",
        "defaultValue": "Test",
        "label": "Auth Token"
      },
      {
        "type": "input",
        "messageKey": "lastSent",
        "defaultValue": "0",
        "label": "Last Sent Timestamp"
      },
      {
      "type": "slider",
      "messageKey": "cfgBundleMax",
      "defaultValue": 50,
      "label": "Max Bundle",
      "description": "Maximum amount of items to bundle into a batch request",
      "min": 1,
      "max": 100,
      "step": 1
    }
    ]
  },
  {
    "type": "section",
    "items": [
      {
        "type": "heading",
        "defaultValue": "More Settings"
      },
      {
        "type": "toggle",
        "messageKey": "cfgAutoClose",
        "label": "AutoClose",
        "defaultValue": false
      },
      {
        "type": "toggle",
        "messageKey": "resend",
        "label": "Resend Data",
        "defaultValue": false
      }
  ]
  },
  {
    "type": "submit",
    "defaultValue": "Save Settings"
  }
];