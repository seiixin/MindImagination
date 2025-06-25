import DarkCave from '@/../../public/Images/DarkCave.jpg';

export default function DescriptionDetails() {
  return (
    <section className="bg-[#14628d] p-4 border-[5px] border-[#0e6ba0] shadow-inner rounded flex flex-col gap-3 text-[#0a192bcc] font-bold max-w-3xl w-full">
      <h2 className="text-lg font-bold text-[#0e3f4c] drop-shadow-sm">DESCRIPTION DETAILS</h2>
      <div className="bg-[#0e4a6a] border-[3px] border-[#0a3548] rounded shadow-inner flex justify-center items-center h-64">
        <img src={DarkCave} alt="Dark cavern game environment" className="max-w-full h-auto rounded drop-shadow-md" />
      </div>
    </section>
  );
}
