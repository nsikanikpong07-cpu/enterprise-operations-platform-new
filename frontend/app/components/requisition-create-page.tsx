"use client";
import {useRouter} from 'next/navigation';
import RequisitionForm from './requisition-form';
type Option={id:string;name:string};
export default function RequisitionCreatePage({items,units,departments,available}:{items:Option[];units:Option[];departments:Option[];available:boolean}){const router=useRouter();return <RequisitionForm items={items} units={units} departments={departments} optionsAvailable={available} onClose={()=>router.push('/workspace/procurement/requisitions')} onCreated={()=>router.push('/workspace/procurement/requisitions')} />}
