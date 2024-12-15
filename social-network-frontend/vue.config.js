const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    hot: true,
    //port: 8080, // Porta padrão do Vue Dev Server
    host: '0.0.0.0',  // Permite acessar de qualquer IP (necessário no Docker)
  }
})
