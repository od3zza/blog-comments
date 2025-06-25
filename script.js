        // Configuração do Supabase - SUBSTITUA PELOS SEUS DADOS!
        const SUPABASE_URL = 'SUA_URL_DO_SUPABASE_AQUI';
        const SUPABASE_ANON_KEY = 'SUA_CHAVE_ANON_AQUI';

        // Função para obter o slug do post atual
        function getPostSlug() {
            // Você pode personalizar isso baseado na estrutura das suas URLs
            const path = window.location.pathname;
            return path.replace(/^\//, '').replace(/\/$/, '') || 'home';
        }

        // Função para fazer requisições ao Supabase
        async function supabaseRequest(endpoint, options = {}) {
            const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
            const headers = {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation',
                ...options.headers
            };

            const response = await fetch(url, {
                ...options,
                headers
            });

            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status}`);
            }

            return response.json();
        }

        // Função para carregar comentários
        async function loadComments() {
            const container = document.getElementById('comments-container');
            const postSlug = getPostSlug();

            try {
                const comments = await supabaseRequest(
                    `comentarios?post_slug=eq.${postSlug}&order=created_at.desc`
                );

                if (comments.length === 0) {
                    container.innerHTML = '<div class="no-comments">Ainda não há comentários. Seja o primeiro!</div>';
                    return;
                }

                container.innerHTML = comments.map(comment => {
                    const date = new Date(comment.created_at).toLocaleString('pt-BR');
                    const authorLink = comment.link ? 
                        `<a href="${comment.link}" class="comment-author" target="_blank" rel="noopener">${comment.nome}</a>` :
                        `<span class="comment-author">${comment.nome}</span>`;

                    return `
                        <div class="comment">
                            <div class="comment-header">
                                ${authorLink}
                                <span class="comment-date">${date}</span>
                            </div>
                            <p class="comment-text">${comment.comentario}</p>
                        </div>
                    `;
                }).join('');

            } catch (error) {
                console.error('Erro ao carregar comentários:', error);
                container.innerHTML = '<div class="error">Erro ao carregar comentários. Tente recarregar a página.</div>';
            }
        }

        // Função para mostrar mensagens
        function showMessage(message, type = 'success') {
            const messageArea = document.getElementById('message-area');
            messageArea.innerHTML = `<div class="${type}">${message}</div>`;
            setTimeout(() => {
                messageArea.innerHTML = '';
            }, 5000);
        }

        // Função para enviar comentário
        async function submitComment(event) {
            event.preventDefault();
            
            const form = event.target;
            const submitBtn = form.querySelector('.btn-submit');
            const formData = new FormData(form);
            
            // Desabilita o botão durante o envio
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';

            try {
                const commentData = {
                    post_slug: getPostSlug(),
                    nome: formData.get('nome').trim(),
                    link: formData.get('link').trim() || null,
                    comentario: formData.get('comentario').trim()
                };

                // Validações básicas
                if (!commentData.nome || !commentData.comentario) {
                    throw new Error('Nome e comentário são obrigatórios.');
                }

                if (commentData.link && !isValidUrl(commentData.link)) {
                    throw new Error('Por favor, insira uma URL válida.');
                }

                await supabaseRequest('comentarios', {
                    method: 'POST',
                    body: JSON.stringify(commentData)
                });

                showMessage('Comentário enviado com sucesso!', 'success');
                form.reset();
                loadComments(); // Recarrega os comentários

            } catch (error) {
                console.error('Erro ao enviar comentário:', error);
                showMessage(error.message || 'Erro ao enviar comentário. Tente novamente.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Enviar Comentário';
            }
        }

        // Função para validar URL
        function isValidUrl(string) {
            try {
                new URL(string);
                return true;
            } catch (_) {
                return false;
            }
        }

        // Inicialização
        document.addEventListener('DOMContentLoaded', function() {
            // Carrega comentários ao carregar a página
            loadComments();

            // Adiciona evento ao formulário
            document.getElementById('comment-form').addEventListener('submit', submitComment);
        });
