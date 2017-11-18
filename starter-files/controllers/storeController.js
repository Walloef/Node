const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
    storage: multer.memoryStorage(),
    filteFilter(req, file, next) {
        const isPhoto = file.mimetype.startWith('image/');
        if(isPhoto) {
            next(null, true);
        } else {
            next({message: 'that file type is\'nt allowed!' }, false)
        }
    }
};

exports.homePage = (req, res) => {
    res.render('index');
};

exports.addStore = (req, res) => {
    res.render('editStore', {
        title: 'Add store'
    });
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async(req, res, next) => {
    if(!req.file) {
        next();
        return;
    } 
    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`;

    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);

    await photo.write(`./public/uploads/${req.body.photo}`);

    next();

};

exports.createStore = async (req, res) => {
    const store = await (new Store(req.body)).save();
    req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);
    res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
    const stores = await Store.find();
    res.render('stores', {title: 'Stores', stores});
};

exports.editStore = async (req, res) => {
    const store = await Store.findOne({_id: req.params.id});
    res.render('editStore', {title: `Edit ${store.name}`, store});
};


exports.updateStore = async (req, res) => {
    req.body.location.type = "Point";
    const store = await Store.findOneAndUpdate({_id: req.params.id}, req.body, {
        new: true, //return the new store instead of the old one
        runValidators: true //only runs on creations if not true
    }).exec();
    req.flash('success', `Successfully updated <strong>${store.name} </strong> <a href="/stores/${store.slug}">View store</a>`);
    res.redirect(`/stores/${store._id}/edit`)
};