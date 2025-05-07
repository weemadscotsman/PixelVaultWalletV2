import { Transaction, TransactionType } from "@/types/blockchain";
import { timeAgo, shortenAddress } from "@/lib/utils";

interface TransactionItemProps {
  transaction: Transaction;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const isSent = transaction.type === TransactionType.TRANSFER && transaction.fromAddress === localStorage.getItem("currentWalletAddress");
  const isMining = transaction.type === TransactionType.MINING_REWARD;
  const isStaking = transaction.type === TransactionType.STAKING_REWARD;
  
  let icon = "ri-arrow-right-up-line";
  let bgColor = "bg-primary-dark";
  let amountColor = "text-status-error";
  let prefix = "-";
  
  if (!isSent) {
    icon = "ri-arrow-left-down-line";
    bgColor = "bg-status-success";
    amountColor = "text-status-success";
    prefix = "+";
  }
  
  if (isMining) {
    icon = "ri-hammer-line";
    bgColor = "bg-status-success";
    amountColor = "text-status-success";
    prefix = "+";
  }
  
  if (isStaking) {
    icon = "ri-stack-line";
    bgColor = "bg-primary";
    amountColor = "text-status-success";
    prefix = "+";
  }
  
  let title = isSent ? "Sent PVX" : "Received PVX";
  if (isMining) title = "Mining Reward";
  if (isStaking) title = "Staking Rewards";
  
  return (
    <div className="flex justify-between items-center p-2 bg-background rounded-md">
      <div className="flex items-center">
        <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center mr-3`}>
          <i className={`${icon} text-white`}></i>
        </div>
        <div>
          <div className="text-sm text-white">{title}</div>
          <div className="text-xs text-gray-400">{timeAgo(transaction.timestamp)}</div>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-sm ${amountColor}`}>
          {prefix}{transaction.amount.toFixed(6)} PVX
        </div>
        <div className="text-xs text-gray-400">
          TX: {shortenAddress(transaction.hash, 2)}
        </div>
      </div>
    </div>
  );
}
