//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated from a template.
//
//     Manual changes to this file may cause unexpected behavior in your application.
//     Manual changes to this file will be overwritten if the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace FIZ_Markerspace.Models
{
    using System;
    using System.Collections.Generic;
    
    public partial class ServiceLog
    {
        public System.Guid service_id { get; set; }
        public System.Guid user_id { get; set; }
        public string wsu_id { get; set; }
        public string first_name { get; set; }
        public string last_name { get; set; }
        public string room_name { get; set; }
        public System.Guid machine_id { get; set; }
        public string machine_name { get; set; }
        public string time_stamp { get; set; }
        public string notes { get; set; }
        public System.Guid room_id { get; set; }
    }
}
