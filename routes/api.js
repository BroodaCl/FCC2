'use strict';

const mongoose = require('mongoose');

// 1. Definir el Esquema y Modelo de Mongoose
const issueSchema = new mongoose.Schema({
  project: { type: String, required: true },
  issue_title: { type: String, required: true },
  issue_text: { type: String, required: true },
  created_by: { type: String, required: true },
  assigned_to: { type: String, default: '' },
  status_text: { type: String, default: '' },
  open: { type: Boolean, default: true },
  created_on: { type: Date, default: Date.now },
  updated_on: { type: Date, default: Date.now }
});

const Issue = mongoose.model('Issue', issueSchema);

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    // --- GET: Ver problemas ---
    .get(async function (req, res){
      let project = req.params.project;
      let filter = req.query;
      
      // Aseguramos que solo busque en el proyecto actual
      filter.project = project;

      try {
        const issues = await Issue.find(filter);
        res.json(issues);
      } catch (err) {
        res.json({ error: 'Error al obtener datos' });
      }
    })
    
    // --- POST: Crear un problema ---
    .post(async function (req, res){
      let project = req.params.project;
      const { issue_title, issue_text, created_by, assigned_to, status_text } = req.body;

      // Validación de campos obligatorios
      if (!issue_title || !issue_text || !created_by) {
        return res.json({ error: 'required field(s) missing' });
      }

      const newIssue = new Issue({
        project,
        issue_title,
        issue_text,
        created_by,
        assigned_to: assigned_to || '',
        status_text: status_text || '',
        open: true,
        created_on: new Date(),
        updated_on: new Date()
      });

      try {
        const savedIssue = await newIssue.save();
        // Devolvemos el objeto sin el campo __v y con el formato correcto
        res.json({
          assigned_to: savedIssue.assigned_to,
          status_text: savedIssue.status_text,
          open: savedIssue.open,
          _id: savedIssue._id,
          issue_title: savedIssue.issue_title,
          issue_text: savedIssue.issue_text,
          created_by: savedIssue.created_by,
          created_on: savedIssue.created_on,
          updated_on: savedIssue.updated_on
        });
      } catch (err) {
        res.send("Error al guardar");
      }
    })
    
    // --- PUT: Actualizar un problema ---
    .put(async function (req, res){
      let project = req.params.project;
      const { _id, ...updateFields } = req.body;

      // 1. Validar si hay ID
      if (!_id) {
        return res.json({ error: 'missing _id' });
      }

      // 2. Validar si hay campos para actualizar
      if (Object.keys(updateFields).length === 0) {
        return res.json({ error: 'no update field(s) sent', '_id': _id });
      }

      // 3. Intentar actualizar
      try {
        updateFields.updated_on = new Date();
        const updatedIssue = await Issue.findByIdAndUpdate(_id, updateFields, { new: true });
        
        if (!updatedIssue) {
          return res.json({ error: 'could not update', '_id': _id });
        }
        
        res.json({  result: 'successfully updated', '_id': _id });
      } catch (err) {
        res.json({ error: 'could not update', '_id': _id });
      }
    })
    
    // --- DELETE: Eliminar un problema ---
    .delete(async function (req, res){
      let project = req.params.project;
      const { _id } = req.body;

      if (!_id) {
        return res.json({ error: 'missing _id' });
      }

      try {
        const deletedIssue = await Issue.findByIdAndDelete(_id);
        
        if (!deletedIssue) {
          return res.json({ error: 'could not delete', '_id': _id });
        }
        
        res.json({ result: 'successfully deleted', '_id': _id });
      } catch (err) {
        res.json({ error: 'could not delete', '_id': _id });
      }
    });
    
};
