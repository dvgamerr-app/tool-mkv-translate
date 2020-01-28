const logger = require('@touno-io/debuger')('translate')
const { promises: fs, existsSync } = require('fs')
const { Translate } = require('@google-cloud/translate').v2
const path = require('path')
const os = require('os')
const err = require('./error')
const yargs = require('yargs')

const { spawn } = require('child_process')

const dirMKVToolNix = 'C:/Program Files/MKVToolNix'
const mkvextract = 'mkvextract.exe'
const mkvinfo = 'mkvinfo.exe'
const mkvmerge = 'mkvmerge.exe'
const translate = new Translate()

const getTrackInfo = async file => {
  let raw = await onExecute(path.join(dirMKVToolNix, mkvinfo), [ file ])
  let data = {
    filename: path.basename(file),
    tracks: []
  }
  let uid = -1
  for (const line of raw.split('\n')) {
    if (/^\|.\+.Track/ig.test(line)) uid++
    if (uid < 0) continue
    const row = /^\|.+?\+.(?<name>.*?):(?<val>.*)/ig.exec(line)
    if (!row) continue
    if (!data.tracks[uid]) data.tracks[uid] = {}
    let { name, val } = row.groups
    name = name.trim().replace(/\W/ig, '-').toLowerCase()
    
    switch (name) {
      case 'track-number':
        val = parseInt(/\d+/ig.exec(val.trim())[0])
        data.tracks[uid]['uid'] = val - 1
        data.tracks[uid][name] = val
        break;
      default:
        data.tracks[uid][name] = val.trim()
        break
    }
  }
  return data
}

const translateText = async (text) => {
  let [ translations ] = await translate.translate(text.split('\\N'), { to: 'th' })
  translations = Array.isArray(translations) ? translations : [ translations ]
  return translations.join('\\N')
}

const assReader = async file => {
  const buff = await fs.readFile(file)
  await fs.unlink(file)

  let pos = 0
  const ass = await fs.open(path.basename(file), 'w')
  for await (let line of buff.toString().split('\n')) {
    line = `${line}\n`
    if (/^Dialogue/ig.test(line)) {
      let [ , style, text ] = /(\d,[\d:.]+?,[\d:.]+?,.*?,.*?,.*?,.*?,.*?,.*?,)(.*)/ig.exec(line)
      if (text) line = `${style}${translateText(text)}\n`
    }
    let data = Buffer.from(line, 'utf-8')
    await ass.write(data, 0, data.length, pos)
    pos += data.length
  }
  await ass.close()
}

const getSubtitle = async (file, track) => {
  if (track['codec-id'] === 'S_TEXT/ASS') {
    const extrackName = path.join(os.tmpdir(), `${path.basename(file)}-${track.uid}.ass`)
    if (existsSync(extrackName)) await fs.unlink(extrackName)
    await onExecute(path.join(dirMKVToolNix, mkvextract), [ 'tracks', file, `${track.uid}:${extrackName}` ])
    await assReader(extrackName)
  } else {
    console.dir(track)
    // throw new Error('Unknow Subtitle extension.')
  }
}

const onExecute = async (exe, args = []) => {
  const ls = spawn(exe, args)
  return new Promise((resolve, reject) => {
    let data = ''
    ls.stdout.on('data', buff => data += buff.toString())
    ls.stderr.on('data', buff => data += buff.toString())
    ls.on('close', code => (!code) ? resolve(data) : reject(data))
  })
}


const onFindAnime = async () => {
  let data = []
  for await (const file of yargs.argv._) {
    if (existsSync(file)) {
      const stat = await fs.stat(file)
      if (stat.isDirectory()) {
        for (const list of await fs.readdir(file)) {
          if (path.extname(list) === '.mkv') data.push(path.join(file, list))
        }
      } else {
        data.push(file)
      }
    }
  }
  return data
}

const checkMKVTool = async () => {
  if (!existsSync(dirMKVToolNix)) throw new Error(err.NO_MKV_TOOL)
  if (!existsSync(path.join(dirMKVToolNix, mkvextract))) throw new Error(err.NO_MKV_TOOL)
  if (!existsSync(path.join(dirMKVToolNix, mkvinfo))) throw new Error(err.NO_MKV_TOOL)
  if (!existsSync(path.join(dirMKVToolNix, mkvmerge))) throw new Error(err.NO_MKV_TOOL)
  logger.log('MKVToolNix Installed.')
  logger.log('Finding .mkv file...')
  let anime = await onFindAnime()
  
  if (!anime.length) throw new Error(err.NO_FILEORDIR)
  logger.log(`tracking info file scan subtitle.`)
  for await (const fullpath of anime) {
    let info = await getTrackInfo(fullpath)
    for (const track of info.tracks) {
      if (track['track-type'] === 'subtitles') {
        let subtitle = await getSubtitle(fullpath, track)
        logger.info(` - ${subtitle} (${track['codec-id']})`)
      }
    }
  }
}

checkMKVTool().then(async () => {

  


  logger.success(`anime translate.`)
}).catch(logger.error)

// GOOGLE_APPLICATION_CREDENTIALS=
// https://cloud.google.com/translate/docs/basic/setup-basic

// mkvinfo.exe C:/Users/GoogleDrive/Sync.Office-Central/test2_subtitle.mkv

// + EBML head
// |+ EBML version: 1
// |+ EBML read version: 1
// |+ Maximum EBML ID length: 4
// |+ Maximum EBML size length: 8
// |+ Document type: matroska
// |+ Document type version: 4
// |+ Document type read version: 2
// + Segment: size 126022734
// |+ Seek head (subentries will be skipped)
// |+ EBML void: size 4012
// |+ Segment information
// | + Timestamp scale: 1000000
// | + Multiplexing application: no_variable_data
// | + Writing application: no_variable_data
// | + Duration: 00:23:55.059000000
// | + Date: Thu Jan 01 00:00:00 1970 UTC
// | + Segment UID: 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00
// |+ Tracks
// | + Track
// |  + Track number: 1 (track ID for mkvmerge & mkvextract: 0)
// |  + Track UID: 1
// |  + Track type: video
// |  + Lacing flag: 0
// |  + Minimum cache: 1
// |  + Codec ID: V_MPEG4/ISO/AVC
// |  + Codec's private data: size 47 (H.264 profile: Main @L3.0)
// |  + Default duration: 00:00:00.041708333 (23.976 frames/fields per second for a video track)
// |  + Language: und
// |  + Video track
// |   + Pixel width: 720
// |   + Pixel height: 480
// |   + Display width: 853
// |   + Display height: 480
// | + Track
// |  + Track number: 2 (track ID for mkvmerge & mkvextract: 1)
// |  + Track UID: 2
// |  + Track type: audio
// |  + Codec ID: A_AAC
// |  + Codec's private data: size 2
// |  + Default duration: 00:00:00.021333333 (46.875 frames/fields per second for a video track)
// |  + Language: und
// |  + Audio track
// |   + Sampling frequency: 48000
// |   + Channels: 2
// | + Track
// |  + Track number: 3 (track ID for mkvmerge & mkvextract: 2)
// |  + Track UID: 3
// |  + Track type: subtitles
// |  + Forced track flag: 1
// |  + Lacing flag: 0
// |  + Codec ID: S_TEXT/ASS
// |  + Codec's private data: size 629
// |  + Name: English
// |+ EBML void: size 1129
// |+ Attachments
// | + Attached
// |  + File name: OpenSans-Semibold.ttf
// |  + MIME type: application/x-truetype-font
// |  + File data: size 221328
// |  + File UID: 1
// |+ Cluster
// mkvextract.exe tracks C:/Users/GoogleDrive/Sync.Office-Central/test2_subtitle.mkv 2:asdasd.srt
