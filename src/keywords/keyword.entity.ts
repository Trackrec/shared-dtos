
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { UserAccounts } from 'src/auth/User.entity';
@Entity()
export class Keywords {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type:'simple-array', nullable:true})
    keywords: string[];

    @OneToOne(() => UserAccounts)
    @JoinColumn({name:'user_id'})
    userAccount: UserAccounts;
}
