import { Armazenador } from "./Armazenador.js";
import { ValidaDebito, ValidaDeposito } from "./Decorators.js";
import { GrupoTransacao } from "./GrupoTransacao.js";
import { TipoTransacao } from "./TipoTransacao.js";
import { Transacao } from "./Transacao.js";

export class Conta {
    protected nome: string
    protected saldo: number = Armazenador.obter<number>("saldo") || 0;
    private transacoes: Transacao[] = Armazenador.obter<Transacao[]>(("transacoes"), (key: string, value: any) => {
        if (key === "data") {
            return new Date(value);
        }
        return value;
    }) || [];

    constructor(nome: string) {
        this.nome = nome;
    }

    @ValidaDebito
    debitar(valor: number) : void {
        this.saldo -= valor;
        Armazenador.salvar("saldo", this.saldo.toString());
    } 

    @ValidaDeposito
    depositar(valor: number) : void {
        this.saldo += valor;
        Armazenador.salvar("saldo", this.saldo.toString());
    }

    getGruposTransacoes(): GrupoTransacao[] {
        const GruposTransacoes: GrupoTransacao[] = [];
        const listaTransacoes: Transacao[] = structuredClone(this.transacoes);
        // Ordenação decrescente das datas
        const transacoesOrdenadas: Transacao[] = listaTransacoes.sort((t1, t2) => t2.data.getTime() - t1.data.getTime());
        let labelAtualGrupoTransacao: string = "";
    
        for (let transacao of transacoesOrdenadas) {
            let labelGrupoTransacao: string = transacao.data.toLocaleDateString("pt-br", { month: "long", year: "numeric" });
    
            if (labelAtualGrupoTransacao != labelGrupoTransacao) {
                labelAtualGrupoTransacao = labelGrupoTransacao;
                GruposTransacoes.push({
                    label: labelGrupoTransacao,
                    transacoes: []
                });
            }
            // Ao adicionar um novo grupo, sempre vamos ao último grupo da lista e ADICIONAMOS a nova transação à lista de transações deste grupo
            GruposTransacoes.at(-1).transacoes.push(transacao)
        }
    
        return GruposTransacoes;
    }

    registrarTransacao(novaTransacao: Transacao): void {
        if (novaTransacao.tipoTransacao === TipoTransacao.DEPOSITO) {
            this.depositar(novaTransacao.valor);
        } else if (novaTransacao.tipoTransacao === TipoTransacao.TRANSFERENCIA || novaTransacao.tipoTransacao === TipoTransacao.BOLETO) {
            this.debitar(novaTransacao.valor);
            // Deixa o valor negativo, indicando no extrato que o valor foi retirado e não adicionado na conta.
            novaTransacao.valor *= -1;
        } else {
            throw new Error("Tipo de transação é inválido!");
        }
        
        this.transacoes.push(novaTransacao);
        Armazenador.salvar("transacoes", JSON.stringify(this.transacoes));
    }

    getTitular() {
        return this.nome;
    }

    getSaldo() {
        return this.saldo;
    }

    getDataAcesso() : Date {
        return new Date();
    }
}

export class ContaPremium extends Conta{
    registrarTransacao(transacao: Transacao): void {
        if (transacao.tipoTransacao === TipoTransacao.DEPOSITO) {
            console.log("ganhou um bônus de 0.50 centavos!")
            transacao.valor += 0.5
        }

        super.registrarTransacao(transacao)
    }
}

const conta = new Conta("Joana da Silva Oliveira");
const contaPremium = new ContaPremium("Juan Muradas");

export default conta;