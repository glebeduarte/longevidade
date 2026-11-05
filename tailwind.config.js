/** @type {import('tailwindcss').Config} */
// Design system v2 · Longevidade. Paleta da marca mantida, com tons de superfície e texto ajustados para contraste 4,5:1.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // marca
        creme: 'rgb(var(--c-creme, 243 238 231) / <alpha-value>)', areia: 'rgb(var(--c-areia, 216 203 185) / <alpha-value>)', cafe: 'rgb(var(--c-cafe, 74 56 45) / <alpha-value>)', oliva: 'rgb(var(--c-oliva, 78 88 57) / <alpha-value>)', terracota: 'rgb(var(--c-terracota, 154 90 66) / <alpha-value>)', cobre: 'rgb(var(--c-cobre, 162 107 85) / <alpha-value>)',
        // papéis
        fundo: 'rgb(var(--c-fundo, 245 241 235) / <alpha-value>)',      // chão da tela
        folha: 'rgb(var(--c-folha, 255 253 250) / <alpha-value>)',      // cartões e campos
        tom: 'rgb(var(--c-tom, 239 232 222) / <alpha-value>)',        // painel tonal, um passo abaixo do fundo
        ativo: 'rgb(var(--c-ativo, 231 223 211) / <alpha-value>)',      // item ativo da navegação
        borda: '#e6ddd1',      // borda de cartão
        regra: '#efe8de',      // divisória de linha
        controle: '#cfc1b0',   // borda de campo
        texto: 'rgb(var(--c-texto, 46 34 27) / <alpha-value>)',
        apoio: 'rgb(var(--c-apoio, 107 90 77) / <alpha-value>)',      // texto secundário, 5,9:1 sobre folha
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
