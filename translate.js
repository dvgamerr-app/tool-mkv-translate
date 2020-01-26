const { Translate } = require('@google-cloud/translate').v2

// Creates a client
const translate = new Translate()

module.exports = async (text, from = 'en', to = 'th') => {
  let [ translations ] = await translate.translate(text, { to })
  translations = Array.isArray(translations) ? translations : [ translations ]
  console.log('Translations:');
  translations.forEach((translation, i) => {
    console.log(`${text[i]} => (th) ${translation}`)
  })
}
