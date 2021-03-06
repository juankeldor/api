'use strict'

const mongoose = require('mongoose')
const { geocoding } = require('../../utils')

const Model = new mongoose.Schema({
  name: String,
  address: String,
  geometry: {
    type: { type: String },
    coordinates: [Number, Number]
  }
})

Model.index({ geometry: '2dsphere' })

Model.pre('save', async doc => {
  if (!doc.geometry && doc.address) {
    try {
      doc.geometry = await geocoding(doc.address)
    } catch (err) {}
  }
})

Model.statics.findByProximity = async function (lat, lng, maxDistance, _id) {
  const options = {
    near: { type: 'Point', coordinates: [lng, lat] },
    distanceField: 'distance',
    spherical: true
  }
  if (_id) options.query = { _id: mongoose.Types.ObjectId(_id) }
  if (maxDistance) options.maxDistance = maxDistance
  const results = await this.aggregate()
    .near(options)
    .exec()
  return results
}

module.exports = mongoose.model('Growler', Model)
