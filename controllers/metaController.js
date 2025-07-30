const Meta = require('../models/Meta');
const { validationResult } = require('express-validator');

const metaController = {
    // Lista todas as metas do usuário
    listar: async (req, res) => {
        try {
            const metas = await Meta.findAll({
                where: { usuario_id: req.session.user.id },
                order: [['data_limite', 'ASC']]
            });

            // Calcula progresso geral
            const metasComProgresso = metas.map(meta => ({
                ...meta.toJSON(),
                progresso: ((meta.valor_atual / meta.valor_alvo) * 100).toFixed(2)
            }));

            res.render('metas/listar', { metas: metasComProgresso });
        } catch (error) {
            console.error('Erro ao listar metas:', error);
            req.session.error = 'Erro ao carregar metas.';
            res.redirect('/');
        }
    },

    // Renderiza formulário de criação
    renderCriar: (req, res) => {
        res.render('metas/criar');
    },

    // Cria nova meta
    criar: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                req.session.error = errors.array()[0].msg;
                return res.redirect('/metas/criar');
            }

            const { nome, valor_alvo, valor_atual, data_inicio, data_limite, descricao } = req.body;
            await Meta.create({
                usuario_id: req.session.user.id,
                nome,
                valor_alvo,
                valor_atual: valor_atual || 0,
                data_inicio,
                data_limite,
                descricao
            });

            req.session.success = 'Meta criada com sucesso!';
            res.redirect('/metas');
        } catch (error) {
            console.error('Erro ao criar meta:', error);
            req.session.error = 'Erro ao criar meta.';
            res.redirect('/metas/criar');
        }
    },

    // Renderiza formulário de edição
    renderEditar: async (req, res) => {
        try {
            const meta = await Meta.findOne({
                where: {
                    meta_id: req.params.id,
                    usuario_id: req.session.user.id
                }
            });

            if (!meta) {
                req.session.error = 'Meta não encontrada.';
                return res.redirect('/metas');
            }

            res.render('metas/editar', { meta });
        } catch (error) {
            console.error('Erro ao carregar meta:', error);
            req.session.error = 'Erro ao carregar dados da meta.';
            res.redirect('/metas');
        }
    },

    // Atualiza meta
    atualizar: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                req.session.error = errors.array()[0].msg;
                return res.redirect(`/metas/editar/${req.params.id}`);
            }

            const { nome, valor_alvo, valor_atual, data_inicio, data_limite, descricao } = req.body;
            const meta = await Meta.findOne({
                where: {
                    meta_id: req.params.id,
                    usuario_id: req.session.user.id
                }
            });

            if (!meta) {
                req.session.error = 'Meta não encontrada.';
                return res.redirect('/metas');
            }

            // Verifica se a meta foi concluída com base nos novos valores
            const concluida = parseFloat(valor_atual) >= parseFloat(valor_alvo);
            
            await meta.update({
                nome,
                valor_alvo,
                valor_atual,
                data_inicio,
                data_limite,
                descricao,
                concluida
            });

            req.session.success = 'Meta atualizada com sucesso!';
            res.redirect('/metas');
        } catch (error) {
            console.error('Erro ao atualizar meta:', error);
            req.session.error = 'Erro ao atualizar meta.';
            res.redirect('/metas');
        }
    },

    // Exclui meta
    excluir: async (req, res) => {
        try {
            const meta = await Meta.findOne({
                where: {
                    meta_id: req.params.id,
                    usuario_id: req.session.user.id
                }
            });

            if (!meta) {
                req.session.error = 'Meta não encontrada.';
                return res.redirect('/metas');
            }

            await meta.destroy();
            req.session.success = 'Meta excluída com sucesso!';
            res.redirect('/metas');
        } catch (error) {
            console.error('Erro ao excluir meta:', error);
            req.session.error = 'Erro ao excluir meta.';
            res.redirect('/metas');
        }
    },

    // Atualiza progresso da meta
    atualizarProgresso: async (req, res) => {
        try {
            const { valor_atual } = req.body;
            const meta = await Meta.findOne({
                where: {
                    meta_id: req.params.id,
                    usuario_id: req.session.user.id
                }
            });

            if (!meta) {
                req.session.error = 'Meta não encontrada.';
                return res.redirect('/metas');
            }

            // Verifica se a meta foi concluída
            const concluida = parseFloat(valor_atual) >= meta.valor_alvo;
            await meta.update({ 
                valor_atual,
                concluida
            });
            req.session.success = 'Progresso atualizado com sucesso!';
            res.redirect('/metas');
        } catch (error) {
            console.error('Erro ao atualizar progresso:', error);
            req.session.error = 'Erro ao atualizar progresso.';
            res.redirect('/metas');
        }
    }
};

module.exports = metaController;