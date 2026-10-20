/** @type {import('tailwindcss').Config} */
// Design system v2 · Longevidade. Paleta da marca mantida, com tons de superfície e texto ajustados para contraste 4,5:1.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // marca
        creme: '#f3eee7', areia: '#d8cbb9', cafe: '#4a382d', oliva: '#4e5839', terracota: '#9a5a42', cobre: '#a26b55',
        // papéis
        fundo: '#f5f1eb',      // chão da tela
        folha: '#fffdfa',      // cartões e campos
        tom: '#efe8de',        // painel tonal, um passo abaixo do fundo
        ativo: '#e7dfd3',      // item ativo da navegação
        borda: '#e6ddd1',      // borda de cartão
        regra: '#efe8de',      // divisória de linha
        controle: '#cfc1b0',   // borda de campo
        texto: '#2e221b',
        apoio: '#6b5a4d',      // texto secundário, 5,9:1 sobre folha
        atencao: '#8a5232',    // texto de atenção, 5,6:1
        positivo: '#45512f',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Jost', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        meta: ['12px', '16px'], corpo: ['14px', '20px'], leitura: ['15px', '24px'],
        bloco: ['16px', '22px'], numero: ['24px', '28px'], pagina: ['32px', '36px'],
      },
      borderRadius: { none: '0', sm: '4px', DEFAULT: '6px', md: '6px', lg: '10px', xl: '14px', full: '9999px' },
    },
  },
  plugins: [],
}
